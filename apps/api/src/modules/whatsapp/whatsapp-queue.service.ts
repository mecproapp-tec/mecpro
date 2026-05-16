import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class WhatsappQueueService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappQueueService.name);

  constructor(
    @InjectQueue('whatsapp') private whatsappQueue: Queue,
    private whatsappService: WhatsappService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.whatsappQueue.empty();
    this.whatsappQueue.process(async (job) => {
      const { type, data } = job.data;
      try {
        let result;
        if (type === 'estimate') {
          result = await this.whatsappService.sendEstimateWithDocument(data.estimate, data.pdfUrl);
        } else if (type === 'invoice') {
          result = await this.whatsappService.sendInvoiceWithDocument(data.invoice, data.pdfUrl);
        } else {
          throw new Error(`Tipo desconhecido: ${type}`);
        }

        await this.prisma.whatsappLog.create({
          data: {
            tenantId: data.tenantId,
            type,
            resourceId: data.resourceId,
            phone: data.phone,
            status: 'SENT',
            messageId: result.messages?.[0]?.id,
            sentAt: new Date(),
          },
        });
        return result;
      } catch (error) {
        this.logger.error(`Falha no job ${job.id}: ${error.message}`);
        await this.prisma.whatsappLog.create({
          data: {
            tenantId: data.tenantId,
            type,
            resourceId: data.resourceId,
            phone: data.phone,
            status: 'FAILED',
            errorMessage: error.message,
            sentAt: new Date(),
          },
        });
        throw error;
      }
    });
  }

  async sendEstimate(tenantId: string, estimateId: number, pdfUrl: string, phone: string, estimate: any) {
    return this.whatsappQueue.add(
      'send',
      {
        type: 'estimate',
        data: {
          tenantId,
          resourceId: estimateId,
          phone,
          pdfUrl,
          estimate,
        },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async sendInvoice(tenantId: string, invoiceId: number, pdfUrl: string, phone: string, invoice: any) {
    return this.whatsappQueue.add(
      'send',
      {
        type: 'invoice',
        data: {
          tenantId,
          resourceId: invoiceId,
          phone,
          pdfUrl,
          invoice,
        },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.whatsappQueue.getWaitingCount(),
      this.whatsappQueue.getActiveCount(),
      this.whatsappQueue.getCompletedCount(),
      this.whatsappQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}