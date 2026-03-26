// src/modules/pdf/pdf.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfService } from './pdf.service';
import { PdfProcessor } from './pdf.processor';
import { StorageModule } from '../storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfController } from './pdf.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'pdf' }),
    StorageModule,
    PrismaModule,
  ],
  providers: [PdfService, PdfProcessor],
  controllers: [PdfController],
  exports: [PdfService],
})
export class PdfModule {}