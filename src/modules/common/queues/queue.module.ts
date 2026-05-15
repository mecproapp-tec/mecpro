import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfProcessor } from './pdf.processor';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';
import { InvoicesModule } from '../../invoices/invoices.module';
import { EstimatesModule } from '../../estimates/estimates.module';

@Module({
  imports: [
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL! } }),
    BullModule.registerQueue({ name: 'pdf' }),
    PrismaModule,
    StorageModule,
    InvoicesModule,
    EstimatesModule,
  ],
  providers: [PdfProcessor],
})
export class QueueModule {}