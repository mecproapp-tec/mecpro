import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME');
    this.publicBaseUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket || !this.publicBaseUrl) {
      this.logger.error('Cloudflare R2 credentials not fully configured');
      throw new Error('Cloudflare R2 credentials missing');
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      });
      await this.s3.send(command);
      const publicUrl = `${this.publicBaseUrl}/${key}`;
      this.logger.log(`Arquivo enviado para R2: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Erro ao fazer upload para R2: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao salvar PDF no armazenamento');
    }
  }

  async get(url: string): Promise<Buffer> {
    try {
      const key = url.replace(`${this.publicBaseUrl}/`, '');
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.s3.send(command);
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      this.logger.log(`Arquivo baixado do R2: ${url}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo do R2: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Falha ao recuperar PDF do armazenamento');
    }
  }
}