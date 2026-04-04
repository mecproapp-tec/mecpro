import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;
  private useFallback = false;

  constructor() {
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : null;

    // 🔥 validação segura
    if (
      !this.bucket ||
      !this.publicUrl ||
      !accountId ||
      !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ) {
      this.logger.error('❌ R2 não configurado corretamente — usando fallback local');
      this.useFallback = true;
      return;
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    this.logger.log(`✅ R2 conectado | Bucket: ${this.bucket}`);
  }

  // =========================
  // 🔥 MÉTODO PADRÃO (USADO PELO SISTEMA)
  // =========================
  async upload(file: Buffer, key: string): Promise<string> {
    if (!file || file.length === 0) {
      throw new InternalServerErrorException('Arquivo inválido');
    }

    if (this.useFallback) {
      return this.saveToLocal(file, key);
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: 'application/pdf',
        }),
      );

      const url = `${this.publicUrl}/${key}`;

      this.logger.log(`✅ Upload realizado: ${url}`);

      return url;
    } catch (error) {
      this.logger.error('❌ Erro no upload R2, ativando fallback', error);
      this.useFallback = true;
      return this.saveToLocal(file, key);
    }
  }

  // =========================
  // 🔥 MÉTODO ESPECÍFICO PDF
  // =========================
  async uploadPdf(buffer: Buffer, fileName: string): Promise<string> {
    const key = `pdfs/${fileName}`;
    return this.upload(buffer, key);
  }

  // =========================
  // 🔥 FALLBACK LOCAL (IMPORTANTE)
  // =========================
  private async saveToLocal(buffer: Buffer, key: string): Promise<string> {
    const localPath = path.join(process.cwd(), 'storage', key);

    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, buffer);

    const apiUrl =
      process.env.API_URL || 'http://localhost:3000/api';

    const url = `${apiUrl}/storage/${key}`;

    this.logger.warn(`⚠️ Fallback local ativo: ${url}`);

    return url;
  }

  // =========================
  // 🔥 GET FILE
  // =========================
  async getFile(key: string): Promise<Buffer> {
    if (this.useFallback) {
      return this.getLocalFile(key);
    }

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const stream = response.Body as any;

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error('❌ Erro ao buscar arquivo no R2', error);
      return this.getLocalFile(key);
    }
  }

  // =========================
  // 🔥 FALLBACK GET LOCAL
  // =========================
  private async getLocalFile(key: string): Promise<Buffer> {
    try {
      const localPath = path.join(process.cwd(), 'storage', key);
      return await fs.readFile(localPath);
    } catch (error) {
      this.logger.error('❌ Erro ao buscar arquivo local', error);
      throw new InternalServerErrorException('Arquivo não encontrado');
    }
  }
}