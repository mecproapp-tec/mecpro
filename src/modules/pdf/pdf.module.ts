import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],   // ESSENCIAL para que outros módulos possam injetar
})
export class PdfModule {}