import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesPdfService } from './invoices-pdf.service';
import { AuthModule } from '../../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    WhatsappModule,
  ],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    InvoicesPdfService,
  ],
  exports: [InvoicesService, InvoicesPdfService],
})
export class InvoicesModule {}