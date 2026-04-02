import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimateStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { EstimatesPdfService } from './estimates-pdf.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    private prisma: PrismaService,
    private estimatesPdfService: EstimatesPdfService,
    private whatsappService: WhatsappService,
    private storageService: StorageService,
  ) {}

  async generateShareToken(id: number, tenantId: string): Promise<string> {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, tenantId },
    });

    if (!estimate) throw new NotFoundException('Orçamento não encontrado');

    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.estimate.update({
      where: { id },
      data: {
        shareToken: token,
        shareTokenExpires: expiresAt,
      },
    });

    return token;
  }

  async validateShareToken(token: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { shareToken: token },
      include: {
        client: true,
        items: true,
        tenant: true,
      },
    });

    if (!estimate) {
      throw new UnauthorizedException('Token inválido');
    }

    if (estimate.shareTokenExpires && new Date() > estimate.shareTokenExpires) {
      throw new UnauthorizedException('Token expirado');
    }

    return estimate;
  }

  async getPdfByShareToken(token: string): Promise<Buffer> {
    const estimate = await this.validateShareToken(token);

    if (estimate.pdfUrl) {
      try {
        return await this.storageService.get(estimate.pdfUrl);
      } catch (err) {
        this.logger.warn('Erro ao buscar PDF, regenerando...');
      }
    }

    const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(
      estimate,
      estimate.tenant,
    );

    const key = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;

    const pdfUrl = await this.storageService.upload(pdfBuffer, key);

    await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        pdfUrl,
        pdfStatus: 'generated',
        pdfGeneratedAt: new Date(),
      },
    });

    return pdfBuffer;
  }

  async sendViaWhatsApp(
    id: number,
    tenantId: string,
  ): Promise<{ whatsappLink: string; pdfUrl: string }> {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        items: true,
        tenant: true,
      },
    });

    if (!estimate) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (!estimate.client.phone) {
      throw new BadRequestException('Cliente sem telefone');
    }

    let token = estimate.shareToken;

    if (!token || (estimate.shareTokenExpires && new Date() > estimate.shareTokenExpires)) {
      token = await this.generateShareToken(id, tenantId);
    }

    const apiBase = (process.env.API_URL || '').replace(/\/api$/, '');

    const pdfPublicUrl = `${apiBase}/api/public/estimates/share/${token}`;

    // 🔥 GERA PDF NA HORA (SEM FILA)
    if (!estimate.pdfUrl || estimate.pdfStatus !== 'generated') {
      const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(
        estimate,
        estimate.tenant,
      );

      const key = `${tenantId}/estimates/${id}.pdf`;

      const pdfUrl = await this.storageService.upload(pdfBuffer, key);

      await this.prisma.estimate.update({
        where: { id },
        data: {
          pdfUrl,
          pdfStatus: 'generated',
          pdfGeneratedAt: new Date(),
        },
      });
    }

    const message = this.buildWhatsAppMessage(estimate, pdfPublicUrl);

    const whatsappLink = this.whatsappService.generateWhatsAppLink(
      estimate.client.phone,
      message,
    );

    return {
      whatsappLink,
      pdfUrl: pdfPublicUrl,
    };
  }

  private buildWhatsAppMessage(estimate: any, pdfUrl: string): string {
    const client = estimate.client;

    return `Olá ${client.name}!

Seu orçamento está pronto ✅

${pdfUrl}

🚗 Veículo: ${client.vehicle || 'Não informado'}
💰 Total: R$ ${estimate.total.toFixed(2)}`;
  }
}