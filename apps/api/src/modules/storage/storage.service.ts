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

    // 🔹 Variáveis
    const endpoint = this.configService.get<string>('CLOUDFLARE_R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL');

    const hasAllConfig =
      endpoint && accessKeyId && secretAccessKey && this.bucket && this.publicUrl;

    // 🔹 Logs de diagnóstico
    this.logger.log(`R2 Endpoint: ${endpoint}`);
    this.logger.log(`R2 Key: ${accessKeyId?.slice(0, 5)}...`);
    this.logger.log(`Use R2: ${!!hasAllConfig}`);

    if (hasAllConfig) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle: true,
        });

        this.useR2 = true;

        this.logger.log('✅ Cloudflare R2 configurado e ativo');
        this.logger.log(`Bucket: ${this.bucket}`);
        this.logger.log(`Public URL: ${this.publicUrl}`);
      } catch (error: any) {
        this.logger.error(`❌ Erro ao configurar cliente R2: ${error.message}`);
        this.useR2 = false;
      }
    } else {
      this.logger.warn(
        '⚠️ Cloudflare R2 não configurado. Usando armazenamento local.',
      );
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

    const normalizedKey = key.toLowerCase().endsWith('.pdf')
      ? key
      : `${key}.pdf`;

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

        this.logger.log(
          `✅ PDF enviado para R2: ${url} (${buffer.length} bytes)`,
        );

        return url;
      } catch (error: any) {
        this.logger.error(`❌ Falha no upload R2: ${error.message}`);
        this.logger.error(`Detalhes: ${JSON.stringify(error)}`);

        // fallback
        return this.uploadPdfLocal(buffer, normalizedKey);
      }
    }

    return this.uploadPdfLocal(buffer, normalizedKey);
  }

  private async uploadPdfLocal(buffer: Buffer, key: string): Promise<string> {
    const localPath = path.join(this.localUploadPath, key);
    const dir = path.dirname(localPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(localPath, buffer);

    const baseUrl =
      this.configService.get<string>('API_URL') ||
      'http://localhost:3000';

    const cleanBaseUrl = baseUrl.replace(/\/api$/, '');

    const localUrl = `${cleanBaseUrl}/api/storage/${key}`;

    this.logger.log(
      `📁 PDF salvo localmente: ${localPath} -> ${localUrl}`,
    );

    return localUrl;
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
      } catch {
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
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );

        this.logger.log(`🗑️ Arquivo removido do R2: ${key}`);
      } catch (error: any) {
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