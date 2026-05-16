import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PublicShareService } from '../public-share/public-share.service';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class SendEstimateWhatsappService {
  private readonly logger = new Logger(SendEstimateWhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private publicShareService: PublicShareService,
    private whatsappService: WhatsappService,
  ) {}

  async execute(estimateId: number): Promise<any> {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { client: true, tenant: true },
    });

    if (!estimate) throw new NotFoundException('Orçamento não encontrado');
    if (!estimate.client?.phone) throw new NotFoundException('Cliente sem telefone');

    let shareToken = estimate.shareToken;
    if (!shareToken) {
      const share = await this.publicShareService.create({
        tenantId: estimate.tenantId,
        type: 'ESTIMATE',
        resourceId: estimate.id,
        expiresInDays: 30,
      });
      shareToken = share.token;
      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: { shareToken, shareTokenExpires: share.expiresAt },
      });
    }

    const shareUrl = this.whatsappService.getShareLink(shareToken, 'estimate');
    const message = this.whatsappService.generateEstimateMessage(estimate, shareUrl);
    const whatsappUrl = this.whatsappService.generateWhatsAppLink(estimate.client.phone, message);

    this.logger.log(`Link WhatsApp gerado para orçamento ${estimate.id}: ${whatsappUrl}`);

    return {
      success: true,
      whatsappUrl,
      shareUrl,
      message,
      clientPhone: estimate.client.phone,
    };
  }
}