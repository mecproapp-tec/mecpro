// apps/api/src/modules/storage/storage.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

    if (
      !this.bucket ||
      !this.publicUrl ||
      !process.env.CLOUDFLARE_R2_ENDPOINT ||
      !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ) {
      throw new Error('❌ R2 não configurado corretamente no .env');
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    this.logger.log(`✅ R2 conectado: ${this.bucket}`);
  }

  async uploadPdf(buffer: Buffer, key: string): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Buffer inválido');
    }
    if (!key) {
      throw new InternalServerErrorException('Key inválida');
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'application/pdf',
        }),
      );

      const url = `${this.publicUrl}/${key}`;
      this.logger.log(`✅ Upload realizado: ${url}`);
      return url;
    } catch (error) {
      this.logger.error('❌ Erro real no upload R2', error);
      throw new InternalServerErrorException('Erro ao enviar PDF para o R2');
    }
  }

  async getFile(key: string): Promise<Buffer> {
    if (!key) throw new InternalServerErrorException('Key inválida');

    try {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const stream = response.Body as any;
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar arquivo: ${key}`, error);
      throw new InternalServerErrorException('Erro ao buscar arquivo');
    }
  }
}