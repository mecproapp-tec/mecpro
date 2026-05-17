import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { SendEstimateWhatsappService } from './send-estimate-whatsapp.service';
import { SendInvoiceWhatsappService } from './send-invoice-whatsapp.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PublicShareModule } from '../public-share/public-share.module';

@Module({
  imports: [PrismaModule, PublicShareModule],
  providers: [WhatsappService, SendEstimateWhatsappService, SendInvoiceWhatsappService],
  controllers: [WhatsappController],
  exports: [SendEstimateWhatsappService, SendInvoiceWhatsappService],
})
export class WhatsappModule {}