import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,

    @InjectQueue('pdf')
    private pdfQueue: Queue,
  ) {}

  private calculate(items: any[]) {
    let total = 0;

    const normalized = items.map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      const iss = item.issPercent ? price * (item.issPercent / 100) : 0;
      const t = (price + iss) * quantity;

      total += t;

      return {
        description: item.description,
        quantity,
        price,
        issPercent: item.issPercent,
        total: t,
      };
    });

    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    if (!data.items?.length) {
      throw new BadRequestException('Fatura sem itens');
    }

    const { items, total } = this.calculate(data.items);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        clientId: data.clientId,
        number: `INV-${uuidv4().slice(0, 8).toUpperCase()}`,
        total,
        status: 'PENDING',
        items: { create: items },
      },
      include: { items: true, client: true, tenant: true },
    });

    await this.pdfQueue.add('generate-pdf', {
      tenantId,
      entityId: invoice.id,
      entityType: 'invoice',
      data: invoice,
    });

    return invoice;
  }

  async generateShareToken(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) throw new NotFoundException();

    if (
      invoice.shareToken &&
      invoice.shareTokenExpires &&
      new Date() < invoice.shareTokenExpires
    ) {
      return invoice.shareToken;
    }

    const token = randomBytes(32).toString('hex');

    await this.prisma.invoice.update({
      where: { id },
      data: {
        shareToken: token,
        shareTokenExpires: new Date(Date.now() + 7 * 86400000),
      },
    });

    return token;
  }

  async sendViaWhatsApp(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { client: true, items: true, tenant: true },
    });

    if (!invoice) throw new NotFoundException();
    if (!invoice.client.phone) throw new BadRequestException('Sem telefone');

    const token = await this.generateShareToken(id);

    const base =
      process.env.API_URL?.replace('/api', '') ||
      'https://api.mecpro.tec.br';

    const url = `${base}/api/public/invoices/share/${token}`;

    await this.pdfQueue.add('generate-pdf', {
      tenantId: invoice.tenantId,
      entityId: invoice.id,
      entityType: 'invoice',
      data: invoice,
    });

    const message = `Olá ${invoice.client.name}!

Sua fatura está pronta ✅

${url}

💰 Total: R$ ${invoice.total.toFixed(2)}`;

    return {
      whatsappLink: this.whatsappService.generateWhatsAppLink(
        invoice.client.phone,
        message,
      ),
      pdfUrl: url,
      queued: true,
    };
  }
}