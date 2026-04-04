import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfService } from './pdf.service';
import { PdfProcessor } from './pdf.processor';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PdfController } from './pdf.controller';

// 🔥 IMPORTA OS SERVICES
import { EstimatesPdfService } from '../estimates/estimates-pdf.service';
import { InvoicesPdfService } from '../invoices/invoices-pdf.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'pdf' }),
    StorageModule,
    PrismaModule,
  ],
  providers: [
    PdfService,
    PdfProcessor,

    // 🔥 ADICIONA AQUI (RESOLVE ERRO)
    EstimatesPdfService,
    InvoicesPdfService,
  ],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}