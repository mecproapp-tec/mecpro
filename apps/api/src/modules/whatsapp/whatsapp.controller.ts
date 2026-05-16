import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SendEstimateWhatsappService } from './send-estimate-whatsapp.service';
import { SendInvoiceWhatsappService } from './send-invoice-whatsapp.service';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, SessionGuard)
export class WhatsappController {
  constructor(
    private sendEstimateWhatsapp: SendEstimateWhatsappService,
    private sendInvoiceWhatsapp: SendInvoiceWhatsappService,
  ) {}

  @Post('estimate/:id')
  async sendEstimateLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.sendEstimateWhatsapp.execute(Number(id));
    return result;
  }

  @Post('invoice/:id')
  async sendInvoiceLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.sendInvoiceWhatsapp.execute(Number(id));
    return result;
  }
}