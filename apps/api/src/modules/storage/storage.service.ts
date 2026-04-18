import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
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

  // 🚀 UPLOAD PDF
  async uploadPdf(buffer: Buffer, key: string): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Buffer inválido');
    }

    const normalizedKey = key.toLowerCase().endsWith('.pdf')
      ? key
      : `${key}.pdf`;

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
        }),
      );

      const url = `${this.publicUrl}/${normalizedKey}`;

      this.logger.log(`✅ ENVIADO PARA R2`);
      this.logger.log(`🌍 URL: ${url}`);

      return url;
    } catch (error: any) {
      this.logger.error('❌ ERRO REAL R2:');
      this.logger.error(error);

      // ❌ NÃO mascara erro
      throw new InternalServerErrorException('Falha no upload para R2');
    }
  }

  // 💾 LOCAL (DEV ONLY)
  private async uploadPdfLocal(buffer: Buffer, key: string): Promise<string> {
    const localPath = path.join(this.localUploadPath, key);
    const dir = path.dirname(localPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(localPath, buffer);

    const baseUrl =
      this.configService.get<string>('API_URL') || 'http://localhost:3000';

    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
    const localUrl = `${cleanBaseUrl}/api/storage/${key}`;

    this.logger.log(`📁 SALVO LOCAL: ${localPath}`);

    return localUrl;
  }

  // 📥 GET FILE (R2 → REDIRECT recomendado)
  getPublicUrl(key: string): string {
    if (!this.publicUrl) {
      throw new InternalServerErrorException('Public URL não configurada');
    }

    return `${this.publicUrl}/${key}`;
  }

  async getFile(key: string): Promise<Buffer> {
    if (this.useR2 && this.s3Client && this.bucket) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
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
        this.logger.error(`❌ ERRO AO BUSCAR NO R2: ${key}`);
        throw new NotFoundException('Arquivo não encontrado no R2');
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
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );

        this.logger.log(`🗑️ REMOVIDO R2: ${key}`);
      } catch (error: any) {
        this.logger.error(`❌ ERRO AO DELETAR: ${error.message}`);
      }
    }
  }
}