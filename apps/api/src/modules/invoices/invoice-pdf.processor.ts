import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InvoicesPdfService } from './invoices-pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('pdf-invoice')
export class InvoicePdfProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoicePdfProcessor.name);

  constructor(
    private invoicesPdfService: InvoicesPdfService,
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; invoiceId: number; tenantData: any; invoiceData: any }>): Promise<any> {
    const { tenantId, invoiceId, tenantData, invoiceData } = job.data;
    this.logger.log(`Gerando PDF para fatura ${invoiceId}`);

    try {
      const pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(invoiceData, tenantData);
      const key = `${tenantId}/invoices/${invoiceId}.pdf`;
      const url = await this.storageService.upload(pdfBuffer, key);

      await this.prisma.invoice.update({
        where: { id: invoiceId, tenantId },
        data: {
          pdfUrl: url,
          pdfStatus: 'generated',
          pdfGeneratedAt: new Date(),
        },
      });

      this.logger.log(`PDF salvo em ${url}`);
      return { url };
    } catch (error) {
      this.logger.error(`Erro: ${error.message}`);
      await this.prisma.invoice.update({
        where: { id: invoiceId, tenantId },
        data: { pdfStatus: 'failed' },
      });
      throw error;
    }
  }
}