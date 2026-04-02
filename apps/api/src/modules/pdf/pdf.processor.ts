import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { EstimatesPdfService } from '../estimates/estimates-pdf.service';
import { InvoicesPdfService } from '../invoices/invoices-pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Processor('pdf')
@Injectable()
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private readonly estimatesPdfService: EstimatesPdfService,
    private readonly invoicesPdfService: InvoicesPdfService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { tenantId, entityId, entityType, data } = job.data;

    this.logger.log(`🚀 Processando PDF: ${entityType} ${entityId}`);

    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) throw new Error('Tenant not found');

      let pdfBuffer: Buffer;

      if (entityType === 'invoice') {
        pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(
          data,
          tenant,
        );
      } else if (entityType === 'estimate') {
        pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(
          data,
          tenant,
        );
      } else {
        throw new Error('Tipo inválido');
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF inválido');
      }

      const key = `${tenantId}/${entityType}s/${entityId}.pdf`;

      const pdfUrl = await this.storageService.upload(pdfBuffer, key);

      if (entityType === 'invoice') {
        await this.prisma.invoice.update({
          where: { id: entityId },
          data: {
            pdfUrl,
            pdfStatus: 'generated',
            pdfGeneratedAt: new Date(),
          },
        });
      } else if (entityType === 'estimate') {
        await this.prisma.estimate.update({
          where: { id: entityId },
          data: {
            pdfUrl,
            pdfStatus: 'generated',
            pdfGeneratedAt: new Date(),
          },
        });
      }

      this.logger.log(`✅ PDF gerado: ${pdfUrl}`);

      return { pdfUrl };
    } catch (error) {
      this.logger.error('❌ Erro na fila PDF', error);
      throw error;
    }
  }
}