const { Queue } = require('bullmq');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL);
const pdfQueue = new Queue('pdf', { connection });

async function trigger() {
  // Altere para um ID real existente no banco
  const entityId = 10;   // ou o ID que você tem
  const entityType = 'invoice';

  await pdfQueue.add('generate-pdf', { entityId, entityType });
  console.log(`✅ Job adicionado: ${entityType} #${entityId}`);
  await connection.quit();
}

trigger().catch(console.error);