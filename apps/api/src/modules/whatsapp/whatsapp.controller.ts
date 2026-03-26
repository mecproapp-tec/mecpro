import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendWhatsappDto } from './dto/send-whatsapp.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Post('send')
  async send(@Body() dto: SendWhatsappDto) {
    await this.whatsappService.sendMessage(dto.phone, dto.message, dto.pdfUrl);
    return { success: true };
  }
}