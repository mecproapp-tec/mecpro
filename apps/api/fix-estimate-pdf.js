const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const { PDFDocument, StandardFonts } = require('pdf-lib');

// ===== CONFIGURAÇÕES (SUBSTITUA PELOS SEUS VALORES) =====
const R2_ACCOUNT_ID = '17eca6b70611402aa664b7d87e93ace0'; // seu account ID
const R2_ACCESS_KEY_ID = 'sua_access_key'; // da dashboard Cloudflare R2
const R2_SECRET_ACCESS_KEY = 'sua_secret_key';
const R2_BUCKET_NAME = 'mecpro-pdfs';
const R2_PUBLIC_URL = 'https://pub-17eca6b70611402aa664b7d87e93ace0.r2.dev';

// ===== Cliente R2 com configuração SSL robusta =====
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  // Força TLS 1.2 e evita handshake problem (opcional)
  tls: true,
  maxAttempts: 3,
});

const prisma = new PrismaClient();

async function uploadBufferToR2(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(command);
  return `${R2_PUBLIC_URL}/${key}`;
}

async function generatePDF(estimate) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  let y = 750;
  const drawText = (text) => {
    page.drawText(text, { x: 50, y, font, size: fontSize });
    y -= 20;
  };

  drawText(`Orçamento #${estimate.id}`);
  drawText(`Cliente: ${estimate.client.name}`);
  drawText(`Total: R$ ${estimate.total.toFixed(2)}`);
  drawText(`Data: ${new Date(estimate.date).toLocaleDateString()}`);
  drawText('Itens:');
  for (const item of estimate.items) {
    drawText(`- ${item.description} | ${item.quantity} x R$ ${item.price} = R$ ${item.total}`);
  }
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function main() {
  const estimate = await prisma.estimate.findUnique({
    where: { id: 1 },
    include: { client: true, items: true, tenant: true },
  });

  if (!estimate) {
    console.error('Orçamento ID 1 não encontrado');
    return;
  }

  console.log('Gerando PDF para orçamento ID:', estimate.id);
  const pdfBuffer = await generatePDF(estimate);

  const key = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;
  console.log('Upload para key:', key);

  const pdfUrl = await uploadBufferToR2(pdfBuffer, key, 'application/pdf');
  console.log('PDF enviado. URL:', pdfUrl);

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      pdfUrl,
      pdfKey: key,
      pdfStatus: 'generated',
      pdfGeneratedAt: new Date(),
    },
  });

  console.log('✅ Orçamento atualizado. Link deve estar acessível.');
}

main().catch(console.error).finally(() => prisma.$disconnect());