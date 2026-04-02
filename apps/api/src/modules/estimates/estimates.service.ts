import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,

    @InjectQueue('pdf')
    private pdfQueue: Queue,
  ) {}

  private calculateItems(items: any[]) {
    let total = 0;

    const normalized = items.map((item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      const iss = item.issPercent ? price * (item.issPercent / 100) : 0;
      const itemTotal = (price + iss) * quantity;

      total += itemTotal;

      return {
        description: item.description,
        price,
        quantity,
        issPercent: item.issPercent,
        total: itemTotal,
      };
    });

    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    if (!data.items?.length) {
      throw new BadRequestException('Orçamento sem itens');
    }

    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });

    if (!client) throw new NotFoundException('Cliente não encontrado');

    const { items, total } = this.calculateItems(data.items);

    const estimate = await this.prisma.estimate.create({
      data: {
        tenantId,
        clientId: data.clientId,
        date: new Date(data.date),
        total,
        status: 'DRAFT',
        items: { create: items },
      },
      include: { items: true, client: true, tenant: true },
    });

    await this.pdfQueue.add('generate-pdf', {
      tenantId,
      entityId: estimate.id,
      entityType: 'estimate',
      data: estimate,
    });

    return estimate;
  }

  async findOne(id: number, tenantId: string, role?: string) {
    const where: any = { id };

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
      where.tenantId = tenantId;
    }

    const estimate = await this.prisma.estimate.findFirst({
      where,
      include: {
        client: true,
        items: true,
      },
    });

    if (!estimate) throw new NotFoundException('Orçamento não encontrado');

    return estimate;
  }

  async generateShareToken(id: number, tenantId: string, role?: string) {
    const estimate = await this.findOne(id, tenantId, role);

    if (
      estimate.shareToken &&
      estimate.shareTokenExpires &&
      new Date() < estimate.shareTokenExpires
    ) {
      return estimate.shareToken;
    }

    const token = randomBytes(32).toString('hex');

    await this.prisma.estimate.update({
      where: { id },
      data: {
        shareToken: token,
        shareTokenExpires: new Date(Date.now() + 7 * 86400000),
      },
    });

    return token;
  }

  async getPdfByShareToken(token: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { shareToken: token },
      include: { client: true, items: true, tenant: true },
    });

    if (!estimate) throw new UnauthorizedException('Token inválido');

    if (estimate.shareTokenExpires && new Date() > estimate.shareTokenExpires) {
      throw new UnauthorizedException('Token expirado');
    }

    if (estimate.pdfUrl) {
      return {
        pdfUrl: estimate.pdfUrl,
      };
    }

    await this.pdfQueue.add('generate-pdf', {
      tenantId: estimate.tenantId,
      entityId: estimate.id,
      entityType: 'estimate',
      data: estimate,
    });

    throw new BadRequestException('PDF ainda está sendo gerado');
  }

  async sendViaWhatsApp(id: number, tenantId: string, role?: string) {
    const estimate = await this.findOne(id, tenantId, role);

    if (!estimate.client.phone) {
      throw new BadRequestException('Cliente sem telefone');
    }

    const token = await this.generateShareToken(id, tenantId, role);

    const base =
      process.env.API_URL?.replace('/api', '') ||
      'https://api.mecpro.tec.br';

    const link = `${base}/api/public/estimates/share/${token}`;

    await this.pdfQueue.add('generate-pdf', {
      tenantId: estimate.tenantId,
      entityId: estimate.id,
      entityType: 'estimate',
      data: estimate,
    });

    const message = `Olá ${estimate.client.name}!

Seu orçamento está pronto ✅

${link}

💰 Total: R$ ${estimate.total.toFixed(2)}`;

    return {
      whatsappLink: this.whatsappService.generateWhatsAppLink(
        estimate.client.phone,
        message,
      ),
      pdfUrl: link,
      queued: true,
    };
  }
}