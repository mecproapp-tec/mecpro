import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private formatPhone(phoneNumber: string): string {
    return phoneNumber.replace(/\D/g, '');
  }

  generateWhatsAppLink(phoneNumber: string, message: string): string {
    const cleanPhone = this.formatPhone(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
  }

  async sendInvoice(invoice: any, shareUrl: string) {
    const message = `📄 *FATURA MECPRO #${invoice.number}*
👤 *Cliente:* ${invoice.client?.name || '-'}
🚗 *Veículo:* ${invoice.client?.vehicle || '-'}
💰 *Total:* R$ ${Number(invoice.total).toFixed(2)}
🔗 *Link:* ${shareUrl}

MecPro - Gestão para Oficinas`;

    const link = this.generateWhatsAppLink(invoice.client.phone, message);

    this.logger.log(`📲 Fatura enviada ${invoice.id}`);

    return { success: true, whatsappUrl: link, message };
  }

  async sendEstimate(estimate: any, shareUrl: string) {
    const message = `📄 *ORÇAMENTO MECPRO #${estimate.id}*
👤 *Cliente:* ${estimate.client?.name || '-'}
🚗 *Veículo:* ${estimate.client?.vehicle || '-'}
💰 *Total:* R$ ${Number(estimate.total).toFixed(2)}
🔗 *Link:* ${shareUrl}

MecPro - Sua oficina de confiança`;

    const link = this.generateWhatsAppLink(estimate.client.phone, message);

    this.logger.log(`📲 Orçamento enviado ${estimate.id}`);

    return { success: true, whatsappUrl: link, message };
  }
}