import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Preencha MANUALMENTE com os valores CORRETOS (após gerar novo token)
const config = {
  accountId: 'bffe9362056d8c708138c6a5df0894b', // seu account id
  accessKeyId: 'NOVA_ACCESS_KEY',
  secretAccessKey: 'NOVA_SECRET_KEY',
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
});

try {
  const result = await s3.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: 'test-minimal.txt',
    Body: 'Hello',
  }));
  console.log('✅ Upload OK', result);
} catch (err) {
  console.error('❌ Erro:', err.message);
  console.error('Código:', err.code);
}