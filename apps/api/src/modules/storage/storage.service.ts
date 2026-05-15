import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private publicUrl: string | null = null;
  private useR2: boolean = false;
  private localUploadPath: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,  // ✅ ADICIONADO para validação de tokens
  ) {
    this.localUploadPath = path.join(process.cwd(), 'uploads', 'pdfs');
    this.ensureLocalDirectory();

    const endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL');

    const hasAllConfig =
      endpoint && accessKeyId && secretAccessKey && this.bucket && this.publicUrl;

    this.logger.log(`R2 Endpoint: ${endpoint}`);
    this.logger.log(`Use R2: ${!!hasAllConfig}`);

    if (hasAllConfig) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 5000,
          socketTimeout: 5000,
        }),
      });

      this.useR2 = true;

      this.logger.log('✅ R2 ATIVO');
      this.logger.log(`Bucket: ${this.bucket}`);
      this.logger.log(`Public URL: ${this.publicUrl}`);
    } else {
      this.logger.warn('⚠️ R2 NÃO CONFIGURADO — usando local');
    }
  }

  private ensureLocalDirectory(): void {
    if (!fs.existsSync(this.localUploadPath)) {
      fs.mkdirSync(this.localUploadPath, { recursive: true });
      this.logger.log(`📁 Diretório criado: ${this.localUploadPath}`);
    }
  }

  // 🔥 NOVO MÉTODO: Validar token de compartilhamento
  async validateShareToken(token: string): Promise<boolean> {
    try {
      const share = await this.prisma.publicShare.findUnique({
        where: { token },
        select: { expiresAt: true, id: true }
      });
      
      if (!share) return false;
      if (share.expiresAt && new Date() > share.expiresAt) return false;
      
      return true;
    } catch (error) {
      this.logger.error('Erro ao validar token:', error);
      return false;
    }
  }

  // 🔥 NOVO MÉTODO: Verificar permissão de acesso ao arquivo
  async checkFileAccess(fileKey: string, tenantId: string): Promise<boolean> {
    // O arquivo deve conter o tenantId no path
    if (!fileKey.includes(tenantId)) {
      this.logger.warn(`❌ Tentativa de acesso a arquivo de outro tenant: ${fileKey} por ${tenantId}`);
      return false;
    }
    return true;
  }

  // 🚀 UPLOAD PDF (com validação de segurança)
  async uploadPdf(buffer: Buffer, key: string, tenantId?: string): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Buffer inválido');
    }

    // 🔥 CORREÇÃO: Sanitizar a key
    const sanitizedKey = this.sanitizeKey(key);
    
    // 🔥 CORREÇÃO: Garantir que a key inclui o tenantId
    if (tenantId && !sanitizedKey.includes(tenantId)) {
      throw new ForbiddenException('A chave do arquivo deve conter o tenantId');
    }

    const normalizedKey = sanitizedKey.toLowerCase().endsWith('.pdf')
      ? sanitizedKey
      : `${sanitizedKey}.pdf`;

    this.logger.log(`📦 KEY: ${normalizedKey}`);

    if (!this.useR2 || !this.s3Client || !this.bucket || !this.publicUrl) {
      this.logger.warn('⚠️ R2 OFF — salvando local');
      return this.uploadPdfLocal(buffer, normalizedKey);
    }

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
          Body: buffer,
          ContentType: 'application/pdf',
          Metadata: {
            uploadedBy: tenantId || 'system',
            uploadedAt: new Date().toISOString(),
          },
        }),
      );

      const url = `${this.publicUrl}/${normalizedKey}`;

      this.logger.log(`✅ ENVIADO PARA R2`);
      this.logger.log(`🌍 URL: ${url}`);

      return url;
    } catch (error: any) {
      this.logger.error('❌ ERRO REAL R2:');
      this.logger.error(error);
      throw new InternalServerErrorException('Falha no upload para R2');
    }
  }

  // 💾 LOCAL (DEV ONLY) com validação de segurança
  private async uploadPdfLocal(buffer: Buffer, key: string): Promise<string> {
    // 🔥 CORREÇÃO: Sanitizar a key
    const sanitizedKey = this.sanitizeKey(key);
    const localPath = path.join(this.localUploadPath, sanitizedKey);
    
    // 🔥 CORREÇÃO: Verificar se o path está dentro do diretório permitido
    const resolvedPath = path.resolve(localPath);
    if (!resolvedPath.startsWith(path.resolve(this.localUploadPath))) {
      throw new ForbiddenException('Caminho de arquivo inválido');
    }
    
    const dir = path.dirname(localPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(localPath, buffer);

    const baseUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:3000';

    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    const localUrl = `${cleanBaseUrl}/api/storage/${sanitizedKey}`;

    this.logger.log(`📁 SALVO LOCAL: ${localPath}`);

    return localUrl;
  }

  // 🔥 NOVO MÉTODO: Sanitizar key para prevenir path traversal
  private sanitizeKey(key: string): string {
    // Remover path traversal
    let normalized = key.replace(/\.\./g, '');
    normalized = normalized.replace(/[;&|`$]/g, '');
    normalized = normalized.replace(/\/\/+/g, '/');
    
    // Garantir que não começa com /
    if (normalized.startsWith('/')) {
      normalized = normalized.substring(1);
    }
    
    return normalized;
  }

  // 📥 GET FILE (com validação de segurança)
  getPublicUrl(key: string): string {
    if (!this.publicUrl) {
      throw new InternalServerErrorException('Public URL não configurada');
    }

    // 🔥 CORREÇÃO: Sanitizar a key
    const sanitizedKey = this.sanitizeKey(key);
    return `${this.publicUrl}/${sanitizedKey}`;
  }

  async getFile(key: string, tenantId?: string): Promise<Buffer> {
    // 🔥 CORREÇÃO: Validar acesso ao arquivo
    if (tenantId && !(await this.checkFileAccess(key, tenantId))) {
      throw new ForbiddenException('Acesso não autorizado a este arquivo');
    }

    // 🔥 CORREÇÃO: Sanitizar a key
    const sanitizedKey = this.sanitizeKey(key);

    if (this.useR2 && this.s3Client && this.bucket) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: sanitizedKey,
          }),
        );

        const stream = response.Body as import('stream').Readable;

        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });
      } catch (error) {
        this.logger.error(`❌ ERRO AO BUSCAR NO R2: ${sanitizedKey}`);
        throw new NotFoundException('Arquivo não encontrado no R2');
      }
    }

    const localPath = path.join(this.localUploadPath, sanitizedKey);
    
    // 🔥 CORREÇÃO: Verificar se o path está dentro do diretório permitido
    const resolvedPath = path.resolve(localPath);
    if (!resolvedPath.startsWith(path.resolve(this.localUploadPath))) {
      throw new ForbiddenException('Caminho de arquivo inválido');
    }

    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    throw new NotFoundException(`Arquivo não encontrado: ${sanitizedKey}`);
  }

  async deleteFile(key: string): Promise<void> {
    // 🔥 CORREÇÃO: Sanitizar a key
    const sanitizedKey = this.sanitizeKey(key);

    if (this.useR2 && this.s3Client && this.bucket) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: sanitizedKey,
          }),
        );

        this.logger.log(`🗑️ REMOVIDO R2: ${sanitizedKey}`);
      } catch (error: any) {
        this.logger.error(`❌ ERRO AO DELETAR: ${error.message}`);
      }
    } else {
      // Deletar localmente
      const localPath = path.join(this.localUploadPath, sanitizedKey);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        this.logger.log(`🗑️ REMOVIDO LOCAL: ${localPath}`);
      }
    }
  }
}