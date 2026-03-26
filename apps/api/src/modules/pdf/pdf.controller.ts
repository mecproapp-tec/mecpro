import { Controller, Post, Body, Req } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  @Post('generate')
  async generateSync(@Body() dto: any, @Req() req) {
    const tenantId = req.user?.tenantId;
    const pdfBuffer = await this.pdfService.generateFromData(dto.data);
    return { buffer: pdfBuffer.toString('base64') };
  }

  @Post('generate-async')
  async generateAsync(@Body() dto: any, @Req() req) {
    const tenantId = req.user?.tenantId;
    await this.pdfQueue.add('generate', {
      tenantId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      data: dto.data,
    });
    return { message: 'PDF generation queued' };
  }
}