import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EstimatesPdfService } from './estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('pdf-estimate')
export class EstimatePdfProcessor extends WorkerHost {
  private readonly logger = new Logger(EstimatePdfProcessor.name);

  constructor(
    private estimatesPdfService: EstimatesPdfService,
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; estimateId: number; tenantData: any; estimateData: any }>): Promise<any> {
    const { tenantId, estimateId, tenantData, estimateData } = job.data;
    this.logger.log(`Gerando PDF para orçamento ${estimateId}`);

    try {
      const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(estimateData, tenantData);
      const key = `${tenantId}/estimates/${estimateId}.pdf`;
      const url = await this.storageService.upload(pdfBuffer, key);

      await this.prisma.estimate.update({
        where: { id: estimateId, tenantId },
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
      await this.prisma.estimate.update({
        where: { id: estimateId, tenantId },
        data: { pdfStatus: 'failed' },
      });
      throw error;
    }
  }
}