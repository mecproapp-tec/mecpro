import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PublicShareService } from '../public-share/public-share.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class SendInvoiceWhatsappService {
  private readonly logger = new Logger(SendInvoiceWhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private publicShareService: PublicShareService,
    private whatsappService: WhatsappService,
  ) {}

  async execute(invoiceId: number): Promise<any> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, tenant: true },
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    if (!invoice.client?.phone) throw new NotFoundException('Cliente sem telefone');

    let shareToken = invoice.shareToken;
    if (!shareToken) {
      const share = await this.publicShareService.create({
        tenantId: invoice.tenantId,
        type: 'INVOICE',
        resourceId: invoice.id,
        expiresInDays: 30,
      });
      shareToken = share.token;
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { shareToken, shareTokenExpires: share.expiresAt },
      });
    }

    const shareUrl = this.whatsappService.getShareLink(shareToken, 'invoice');
    const message = this.whatsappService.generateInvoiceMessage(invoice, shareUrl);
    const whatsappUrl = this.whatsappService.generateWhatsAppLink(invoice.client.phone, message);

    this.logger.log(`Link WhatsApp gerado para fatura ${invoice.number}: ${whatsappUrl}`);

    return {
      success: true,
      whatsappUrl,
      shareUrl,
      message,
      clientPhone: invoice.client.phone,
    };
  }
}