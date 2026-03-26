import { Controller, Post, Param, UseGuards, Inject, forwardRef, Req } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderService } from './order.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Controller('orders')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private whatsappService: WhatsappService,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  @Post(':id/send-whatsapp')
  async sendWhatsapp(@Req() request: any, @Param('id') id: string) {
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new Error('Tenant não identificado');
    }

    const order = await this.orderService.getOrderForPdf(tenantId, id);

    if (!order.pdfUrl) {
      await this.pdfQueue.add('generate', {
        tenantId,
        entityId: id,
        entityType: 'order',
        data: this.orderService.preparePdfData(order),
      });

      return { message: 'PDF em processamento. O WhatsApp será enviado em breve.' };
    }

    await this.whatsappService.sendMessage(order.phone, 'Seu pedido está pronto', order.pdfUrl);
    return { message: 'WhatsApp enviado com sucesso' };
  }
}