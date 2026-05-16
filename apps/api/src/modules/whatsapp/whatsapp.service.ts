import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('55') && cleaned.length === 13) return cleaned;
    if (cleaned.length === 11) return `55${cleaned}`;
    if (cleaned.length === 10) return `55${cleaned}`;
    return cleaned;
  }

  generateWhatsAppLink(phoneNumber: string, message: string): string {
    const cleanPhone = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  generateEstimateMessage(estimate: any, shareUrl: string): string {
    return `📄 *ORÇAMENTO MECPRO #${estimate.id}*
👤 Cliente: ${estimate.client.name}
🚗 Veículo: ${estimate.client.vehicle || '-'}
💰 Total: R$ ${Number(estimate.total).toFixed(2)}
🔗 Link: ${shareUrl}

MecPro - Gestão para Oficinas`;
  }

  generateInvoiceMessage(invoice: any, shareUrl: string): string {
    return `📄 *FATURA MECPRO #${invoice.number}*
👤 Cliente: ${invoice.client.name}
🚗 Veículo: ${invoice.client.vehicle || '-'}
💰 Total: R$ ${Number(invoice.total).toFixed(2)}
🔗 Link: ${shareUrl}

MecPro - Sua oficina de confiança`;
  }

  getShareLink(shareToken: string, type: 'estimate' | 'invoice'): string {
    const baseUrl = process.env.APP_URL || 'https://api.mecpro.tec.br';
    return `${baseUrl}/api/public/${type}s/share/${shareToken}`;
  }
}