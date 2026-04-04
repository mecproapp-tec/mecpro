import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Agent } from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const config = {
  accountId: 'bffe9362056d8c708138c6a5df0894b',
  accessKeyId: 'b78b8417d28e6b3d16518e27a4ce9fef',
  secretAccessKey: '2100fd59c0d09d8e7f496b2c611c42bb6d23f2d79dc3e0893a82d33c95a0407c',
  bucket: 'mecpro-pdfs'
};

const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  forcePathStyle: true,
  requestHandler: {
    httpsAgent: new Agent({ rejectUnauthorized: false })
  }
});

try {
  await s3.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: 'test-insecure.txt',
    Body: 'Hello'
  }));
  console.log('✅ Upload bem-sucedido com SSL ignorado');
} catch (err) {
  console.error('❌ Erro:', err.message);
}