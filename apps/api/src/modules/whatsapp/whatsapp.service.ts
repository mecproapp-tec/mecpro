import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendMessage(phone: string, message: string, pdfUrl?: string): Promise<void> {
    const fullMessage = pdfUrl ? `${message}\n\nAcesse o PDF: ${pdfUrl}` : message;

    this.logger.log(`Enviando mensagem WhatsApp para ${phone}`);
    const response = await axios.post(process.env.WHATSAPP_API_URL, {
      to: phone,
      text: fullMessage,
    }, {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` },
    });

    if (response.status !== 200) {
      throw new Error(`Erro na API do WhatsApp: ${response.statusText}`);
    }
  }

  generateWhatsAppLink(phone: string, message: string): string {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
  }
}