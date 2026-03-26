import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(
    private pdfService: PdfService,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  @Post('generate')
  async generateSync(@Body() dto: any, @Req() req) {
    const pdfBuffer = await this.pdfService.generateFromData(dto.data);
    return { buffer: pdfBuffer.toString('base64') };
  }

  @Post('generate-async')
  async generateAsync(@Body() dto: any, @Req() req) {
    const tenantId = req.user.tenantId;
    await this.pdfQueue.add('generate', {
      tenantId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      data: dto.data,
    });
    return { message: 'PDF generation queued' };
  }
}