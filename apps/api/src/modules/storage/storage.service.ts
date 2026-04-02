import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY');

    this.bucket = this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME')!;
    this.publicBaseUrl = this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL')!;

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket || !this.publicBaseUrl) {
      this.logger.error('❌ Cloudflare R2 não configurado corretamente');
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

    this.logger.log('✅ StorageService inicializado com R2');
  }

  /**
   * Upload de arquivo
   */
  async upload(
    buffer: Buffer,
    key: string,
    contentType = 'application/pdf',
  ): Promise<string> {
    try {
      const cleanKey = key.replace(/^\/+/, '');

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      });

      await this.s3.send(command);

      const publicUrl = `${this.publicBaseUrl}/${cleanKey}`;

      this.logger.log(`📤 Upload R2: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      const err = error as Error;

      this.logger.error(
        `❌ Erro upload R2: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException(
        'Falha ao salvar arquivo no armazenamento',
      );
    }
  }

  /**
   * Baixar arquivo
   */
  async get(url: string): Promise<Buffer> {
    try {
      if (!url.startsWith(this.publicBaseUrl)) {
        throw new Error('URL inválida para este bucket');
      }

      const key = url.replace(`${this.publicBaseUrl}/`, '');

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3.send(command);

      if (!response.Body) {
        throw new Error('Arquivo vazio ou não encontrado');
      }

      const stream = response.Body as Readable;

      const chunks: Uint8Array[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk as Uint8Array);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      const err = error as Error;

      this.logger.error(
        `❌ Erro download R2: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException(
        'Falha ao recuperar arquivo do armazenamento',
      );
    }
  }

  /**
   * Deletar arquivo
   */
  async delete(url: string): Promise<void> {
    try {
      if (!url.startsWith(this.publicBaseUrl)) {
        throw new Error('URL inválida para este bucket');
      }

      const key = url.replace(`${this.publicBaseUrl}/`, '');

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);

      this.logger.log(`🗑️ Arquivo removido: ${url}`);
    } catch (error) {
      const err = error as Error;

      this.logger.error(
        `❌ Erro ao deletar arquivo: ${err.message}`,
        err.stack,
      );

      throw new InternalServerErrorException(
        'Falha ao deletar arquivo',
      );
    }
  }
}