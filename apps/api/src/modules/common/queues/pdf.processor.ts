// src/modules/common/queues/pdf.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InvoicesPdfService } from '../../invoices/invoices-pdf.service';
import { EstimatesPdfService } from '../../estimates/estimates-pdf.service';
import { StorageService } from '../../storage/storage.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Processor('pdf')
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private invoicesPdf: InvoicesPdfService,
    private estimatesPdf: EstimatesPdfService,
    private storage: StorageService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ type: 'invoice' | 'estimate'; id: number; tenantId: string }>) {
    const { type, id, tenantId } = job.data;
    this.logger.log(`Processando PDF ${type} ${id}`);

    if (type === 'invoice') {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id },
        include: { client: true, tenant: true, items: true },
      });
      const pdfBuffer = await this.invoicesPdf.generateInvoicePdf(invoice);
      const key = `${tenantId}/invoices/${id}-${Date.now()}.pdf`;
      const url = await this.storage.uploadPdf(pdfBuffer, key);
      await this.prisma.invoice.update({
        where: { id },
        data: { 
          pdfUrl: url, 
          pdfKey: key, 
          pdfStatus: 'generated', 
          pdfGeneratedAt: new Date() 
        },
      });
    } else {
      const estimate = await this.prisma.estimate.findUnique({
        where: { id },
        include: { client: true, tenant: true, items: true },
      });
      const pdfBuffer = await this.estimatesPdf.generateEstimatePdf(estimate);
      const key = `${tenantId}/estimates/${id}-${Date.now()}.pdf`;
      const url = await this.storage.uploadPdf(pdfBuffer, key);
      await this.prisma.estimate.update({
        where: { id },
        data: { 
          pdfUrl: url, 
          pdfKey: key, 
          pdfStatus: 'generated', 
          pdfGeneratedAt: new Date() 
        },
      });
    }
    return { success: true };
  }
}