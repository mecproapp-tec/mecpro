// src/modules/pdf/pdf.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PdfService } from './pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('pdf')
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private pdfService: PdfService,
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; entityId: string; entityType: string; data: any }>): Promise<any> {
    const { tenantId, entityId, entityType, data } = job.data;
    this.logger.log(`Processing PDF generation for ${entityType} ${entityId}`);

    const pdfBuffer = await this.pdfService.generateFromData(data);
    const url = await this.storageService.upload(pdfBuffer, `${tenantId}/${entityType}/${entityId}.pdf`);

    const updateData = { pdfUrl: url };
    await this.prisma[entityType].update({
      where: { id: entityId, tenantId },
      data: updateData,
    });

    this.logger.log(`PDF generated and stored at ${url}`);
    return { url };
  }
}