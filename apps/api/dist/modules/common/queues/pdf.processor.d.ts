import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InvoicesPdfService } from '../../invoices/invoices-pdf.service';
import { EstimatesPdfService } from '../../estimates/estimates-pdf.service';
import { StorageService } from '../../storage/storage.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
export declare class PdfProcessor extends WorkerHost {
    private invoicesPdf;
    private estimatesPdf;
    private storage;
    private prisma;
    private readonly logger;
    constructor(invoicesPdf: InvoicesPdfService, estimatesPdf: EstimatesPdfService, storage: StorageService, prisma: PrismaService);
    process(job: Job<{
        type: 'invoice' | 'estimate';
        id: number;
        tenantId: string;
    }>): Promise<{
        success: boolean;
    }>;
}
