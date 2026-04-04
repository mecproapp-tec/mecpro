import { Worker } from 'bullmq';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EstimatesPdfService } from './modules/estimates/estimates-pdf.service';
import { PrismaService } from './shared/prisma/prisma.service';

dotenv.config();

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const pdfService = app.get(EstimatesPdfService);
  const prisma = app.get(PrismaService);

  const worker = new Worker(
    'pdf',
    async (job) => {
      console.log('🔥 Processando job:', job.name);

      const { entityId, entityType } = job.data;

      if (entityType === 'estimate') {
        const estimate = await prisma.estimate.findUnique({
          where: { id: entityId },
          include: { client: true, items: true, tenant: true },
        });

        if (!estimate) {
          throw new Error('Orçamento não encontrado');
        }

        // 🔥 GERA PDF
        const pdfBuffer = await pdfService.generateEstimatePdf(
          estimate,
          estimate.tenant,
        );

        // 👉 Aqui depois vamos salvar no R2 (próximo passo)
        console.log(`✅ PDF gerado (${pdfBuffer.length} bytes)`);

        // TEMPORÁRIO (produção depois)
        await prisma.estimate.update({
          where: { id: entityId },
          data: {
            pdfUrl: `generated-local-${entityId}.pdf`,
          },
        });
      }
    },
    {
      connection: {
        url: process.env.REDIS_URL, // 🔥 Railway
      },
    },
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} concluído`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} falhou:`, err);
  });

  console.log('🚀 Worker iniciado...');
}

bootstrapWorker();