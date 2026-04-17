import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ConfigService } from '@nestjs/config';
import { Agent } from 'https';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private publicUrl: string | null = null;
  private useR2: boolean = false;
  private localUploadPath: string;

  constructor(private configService: ConfigService) {
    this.localUploadPath = path.join(process.cwd(), 'uploads', 'pdfs');
    this.ensureLocalDirectory();

    const endpoint = this.configService.get('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.configService.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = this.configService.get('CLOUDFLARE_R2_PUBLIC_URL');

    const hasAllConfig = endpoint && accessKeyId && secretAccessKey && this.bucket && this.publicUrl;

    if (hasAllConfig) {
      try {
        // 🔧 Configura o agente HTTPS para ignorar erros de SSL (necessário no Railway)
        const agent = new Agent({
          rejectUnauthorized: false,
        });

        this.s3Client = new S3Client({
          region: 'auto',
          endpoint,
          credentials: { accessKeyId, secretAccessKey },
          forcePathStyle: true,
          requestHandler: new NodeHttpHandler({
            httpsAgent: agent,
          }),
        });
        this.useR2 = true;
        this.logger.log('✅ Cloudflare R2 configurado e ativo');
        this.logger.log(`   Endpoint: ${endpoint}`);
        this.logger.log(`   Bucket: ${this.bucket}`);
        this.logger.log(`   Public URL: ${this.publicUrl}`);
      } catch (error) {
        this.logger.error(`❌ Erro ao configurar cliente R2: ${error.message}`);
        this.useR2 = false;
      }
    } else {
      this.logger.warn('⚠️ Cloudflare R2 não configurado (variáveis faltando). Usando armazenamento local.');
      if (!endpoint) this.logger.warn('  - CLOUDFLARE_R2_ENDPOINT ausente');
      if (!accessKeyId) this.logger.warn('  - CLOUDFLARE_R2_ACCESS_KEY_ID ausente');
      if (!secretAccessKey) this.logger.warn('  - CLOUDFLARE_R2_SECRET_ACCESS_KEY ausente');
      if (!this.bucket) this.logger.warn('  - CLOUDFLARE_R2_BUCKET_NAME ausente');
      if (!this.publicUrl) this.logger.warn('  - CLOUDFLARE_R2_PUBLIC_URL ausente');
    }
  }

  private ensureLocalDirectory(): void {
    if (!fs.existsSync(this.localUploadPath)) {
      fs.mkdirSync(this.localUploadPath, { recursive: true });
      this.logger.log(`📁 Diretório local criado: ${this.localUploadPath}`);
    }
  }

  async uploadPdf(buffer: Buffer, key: string): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Buffer inválido para upload');
    }

    const normalizedKey = key.toLowerCase().endsWith('.pdf') ? key : `${key}.pdf`;

    if (this.useR2 && this.s3Client && this.bucket && this.publicUrl) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: normalizedKey,
            Body: buffer,
            ContentType: 'application/pdf',
            CacheControl: 'no-store',
          }),
        );
        const url = `${this.publicUrl}/${normalizedKey}`;
        this.logger.log(`✅ PDF enviado para R2: ${url} (${buffer.length} bytes)`);
        return url;
      } catch (error) {
        this.logger.error(`❌ Falha no upload R2: ${error.message}`);
        this.logger.error(`Detalhes: ${JSON.stringify(error)}`);
        // Fallback para local
        return this.uploadPdfLocal(buffer, normalizedKey);
      }
    }

    return this.uploadPdfLocal(buffer, normalizedKey);
  }

  private async uploadPdfLocal(buffer: Buffer, key: string): Promise<string> {
    const localPath = path.join(this.localUploadPath, key);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localPath, buffer);
    const baseUrl = this.configService.get('API_URL') || 'http://localhost:3000';
    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    const localUrl = `${cleanBaseUrl}/api/storage/${key}`;
    this.logger.log(`📁 PDF salvo localmente: ${localPath} -> ${localUrl}`);
    return localUrl;
  }

  async getFile(key: string): Promise<Buffer> {
    if (this.useR2 && this.s3Client && this.bucket) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        );
        const stream = response.Body as import('stream').Readable;
        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });
      } catch (error) {
        this.logger.warn(`Arquivo não encontrado no R2: ${key}, tentando local...`);
      }
    }

    const localPath = path.join(this.localUploadPath, key);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    throw new NotFoundException(`Arquivo não encontrado: ${key}`);
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useR2 && this.s3Client && this.bucket) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        );
        this.logger.log(`🗑️ Arquivo removido do R2: ${key}`);
      } catch (error) {
        this.logger.error(`Erro ao deletar do R2: ${error.message}`);
      }
    }

    const localPath = path.join(this.localUploadPath, key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      this.logger.log(`🗑️ Arquivo local removido: ${localPath}`);
    }
  }
}