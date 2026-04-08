const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = '17eca6b70611402aa664b7d87e93ace0';
const R2_ACCESS_KEY_ID = 'sua_access_key';
const R2_SECRET_ACCESS_KEY = 'sua_secret_key';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function test() {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log('Conexão OK. Buckets:', data.Buckets.map(b => b.Name));
  } catch (err) {
    console.error('Falha na conexão:', err);
  }
}
test();