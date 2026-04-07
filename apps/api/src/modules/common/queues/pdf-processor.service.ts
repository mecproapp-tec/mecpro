// apps/api/src/modules/common/queues/pdf-processor.service.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { InvoicesPdfService } from 'src/modules/invoices/invoices-pdf.service';
import { EstimatesPdfService } from 'src/modules/estimates/estimates-pdf.service';
import { StorageService } from 'src/modules/storage/storage.service';

@Processor('pdf')
export class PdfProcessorService extends WorkerHost {
  private readonly logger = new Logger(PdfProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesPdfService: InvoicesPdfService,
    private readonly estimatesPdfService: EstimatesPdfService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'generate-pdf') {
      this.logger.warn(`Job ignorado: ${job.name}`);
      return;
    }

    const { tenantId, entityId, entityType, data } = job.data;

    this.logger.log(`🚀 Processando ${entityType} #${entityId}`);

    try {
      let pdfBuffer: Buffer;

      if (entityType === 'invoice') {
        pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(data, data.tenant);
      } else if (entityType === 'estimate') {
        pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(data, data.tenant);
      } else {
        throw new Error(`Tipo inválido: ${entityType}`);
      }

      const key = `${tenantId}/${entityType}s/${entityId}.pdf`;
      const url = await this.storageService.uploadPdf(pdfBuffer, key);

      if (entityType === 'invoice') {
        await this.prisma.invoice.update({
          where: { id: entityId },
          data: {
            pdfUrl: url,
            pdfKey: key,
            pdfStatus: 'generated',
            pdfGeneratedAt: new Date(),
          },
        });
      } else if (entityType === 'estimate') {
        await this.prisma.estimate.update({
          where: { id: entityId },
          data: {
            pdfUrl: url,
            pdfKey: key,
          },
        });
      }

      this.logger.log(`✅ PDF salvo: ${url}`);
    } catch (error) {
      this.logger.error(`❌ Erro no processamento do PDF`, error);
      if (entityType === 'invoice') {
        await this.prisma.invoice.update({
          where: { id: entityId },
          data: { pdfStatus: 'error' },
        });
      }
    }
  }
}