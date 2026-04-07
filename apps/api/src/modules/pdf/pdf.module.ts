import { Module } from '@nestjs/common';

import { EstimatesPdfService } from '../estimates/estimates-pdf.service';
import { InvoicesPdfService } from '../invoices/invoices-pdf.service';

import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    StorageModule,
    PrismaModule,
    SharedModule,
  ],
  providers: [
    EstimatesPdfService,
    InvoicesPdfService,
  ],
  exports: [
    EstimatesPdfService,
    InvoicesPdfService,
  ],
})
export class PdfModule {}