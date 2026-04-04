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

type PdfResult =
  | { pdfUrl: string }
  | { generating: true };

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,

    @InjectQueue('pdf')
    private pdfQueue: Queue,
  ) {}

  // =========================
  // CALCULO
  // =========================
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

  // =========================
  // CREATE
  // =========================
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

    // 🔥 Envia para fila gerar PDF
    await this.pdfQueue.add('generate-pdf', {
      tenantId,
      entityId: estimate.id,
      entityType: 'estimate',
      data: estimate,
    });

    this.logger.log(`📄 Orçamento criado e enviado para fila: ${estimate.id}`);

    return estimate;
  }

  // =========================
  // LISTAR
  // =========================
  async findAll(tenantId: string, role?: string) {
    const where: any = {};

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
      where.tenantId = tenantId;
    }

    return this.prisma.estimate.findMany({
      where,
      include: {
        client: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================
  // BUSCAR UM
  // =========================
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

  // =========================
  // UPDATE
  // =========================
  async update(id: number, tenantId: string, data: any, role?: string) {
    await this.findOne(id, tenantId, role);

    const { items, total } = this.calculateItems(data.items);

    return this.prisma.estimate.update({
      where: { id },
      data: {
        clientId: data.clientId,
        date: new Date(data.date),
        total,
        status: data.status || 'DRAFT',
        items: {
          deleteMany: {},
          create: items,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: number, tenantId: string, role?: string) {
    await this.findOne(id, tenantId, role);

    return this.prisma.estimate.delete({
      where: { id },
    });
  }

  // =========================
  // TOKEN PUBLICO
  // =========================
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

  // =========================
  // PDF PUBLICO
  // =========================
  async getPdfByShareToken(token: string): Promise<PdfResult> {
    const estimate = await this.prisma.estimate.findFirst({
      where: { shareToken: token },
      include: { client: true, items: true, tenant: true },
    });

    if (!estimate) throw new UnauthorizedException('Token inválido');

    if (estimate.shareTokenExpires && new Date() > estimate.shareTokenExpires) {
      throw new UnauthorizedException('Token expirado');
    }

    // ✅ Se já tem PDF → retorna
    if (estimate.pdfUrl) {
      return { pdfUrl: estimate.pdfUrl };
    }

    // 🔥 Se não tem → gera
    await this.pdfQueue.add('generate-pdf', {
      tenantId: estimate.tenantId,
      entityId: estimate.id,
      entityType: 'estimate',
      data: estimate,
    });

    this.logger.warn(`📄 PDF ainda não pronto. Gerando: ${estimate.id}`);

    return { generating: true };
  }

  // =========================
  // WHATSAPP
  // =========================
  async sendViaWhatsApp(id: number, tenantId: string, role?: string) {
    const estimate = await this.findOne(id, tenantId, role);

    if (!estimate.client.phone) {
      throw new BadRequestException('Cliente sem telefone');
    }

    const token = await this.generateShareToken(id, tenantId, role);

    const frontendBase =
      process.env.FRONTEND_URL || 'https://mecpro.tec.br';

    const link = `${frontendBase}/share/${token}`;

    const message = `Olá ${estimate.client.name}!

Seu orçamento está pronto ✅

📄 Visualizar:
${link}

📥 PDF:
${estimate.pdfUrl || 'Gerando...'}

💰 Total: R$ ${estimate.total.toFixed(2)}`;

    return {
      whatsappLink: this.whatsappService.generateWhatsAppLink(
        estimate.client.phone,
        message,
      ),
      pdfUrl: estimate.pdfUrl,
      publicLink: link,
      queued: true,
    };
  }
}