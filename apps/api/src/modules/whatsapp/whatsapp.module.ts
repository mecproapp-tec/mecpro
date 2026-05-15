import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { SendEstimateWhatsappService } from './send-estimate-whatsapp.service';
import { StorageModule } from '../storage/storage.module';
import { EstimatesPdfService } from '../estimates/estimates-pdf.service';
import { InvoicesPdfService } from '../invoices/invoices-pdf.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [StorageModule, PrismaModule],
  providers: [
    WhatsappService,
    SendEstimateWhatsappService,
    EstimatesPdfService,
    InvoicesPdfService,
  ],
  controllers: [WhatsappController],
  exports: [WhatsappService, SendEstimateWhatsappService],
})
export class WhatsappModule {}