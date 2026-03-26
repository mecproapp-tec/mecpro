import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PdfService } from './pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
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

  async process(job: Job<{ tenantId: string; entityId: number; entityType: string; data: any }>): Promise<any> {
    const { tenantId, entityId, entityType, data } = job.data;
    this.logger.log(`Gerando PDF para ${entityType} ID ${entityId}`);

    try {
      const pdfBuffer = await this.pdfService.generateFromData(data);
      const key = `${tenantId}/${entityType}/${entityId}.pdf`;
      const url = await this.storageService.upload(pdfBuffer, key);

      await this.prisma[entityType].update({
        where: { id: entityId, tenantId },
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
      await this.prisma[entityType].update({
        where: { id: entityId, tenantId },
        data: { pdfStatus: 'failed' },
      });
      throw error;
    }
  }
}