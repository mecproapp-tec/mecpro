// src/modules/pdf/pdf.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('pdf')
@UseGuards(TenantGuard)
export class PdfController {
  constructor(
    private pdfService: PdfService,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  @Post('generate')
  async generateSync(@Tenant() tenantId: string, @Body() dto: GeneratePdfDto) {
    const pdfBuffer = await this.pdfService.generateFromData(dto.data);
    return { buffer: pdfBuffer.toString('base64') };
  }

  @Post('generate-async')
  async generateAsync(@Tenant() tenantId: string, @Body() dto: GeneratePdfDto) {
    await this.pdfQueue.add('generate', {
      tenantId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      data: dto.data,
    });
    return { message: 'PDF generation queued' };
  }
}