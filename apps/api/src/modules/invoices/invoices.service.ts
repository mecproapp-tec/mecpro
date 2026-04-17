import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { InvoicesPdfService } from './invoices-pdf.service';
import { StorageService } from '../storage/storage.service';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private invoicesPdfService: InvoicesPdfService,
    private storageService: StorageService,
  ) {}

  private calculate(items: any[]) {
    let total = new Prisma.Decimal(0);
    const normalized = items.map((item) => {
      const price = new Prisma.Decimal(item.price || 0);
      const quantity = new Prisma.Decimal(item.quantity || 1);
      const itemTotal = price.times(quantity);
      total = total.plus(itemTotal);
      return {
        description: item.description || '-',
        quantity: quantity.toNumber(),
        price,
        total: itemTotal,
      };
    });
    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    const { clientId, items: inputItems } = data;
    if (!tenantId) throw new BadRequestException('TenantId não informado');
    if (!clientId) throw new BadRequestException('Cliente não informado');
    if (!inputItems?.length) throw new BadRequestException('Fatura sem itens');

    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new BadRequestException('Cliente não encontrado');

    const { items, total } = this.calculate(inputItems);

    const generateUniqueNumber = async (retries = 3): Promise<string> => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const number = `FAT-${timestamp}${random}`;
      const existing = await this.prisma.invoice.findUnique({ where: { number } });
      if (existing && retries > 0) return generateUniqueNumber(retries - 1);
      if (existing) throw new Error('Não foi possível gerar número único');
      return number;
    };

    const invoiceNumber = await generateUniqueNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        clientId,
        number: invoiceNumber,
        total,
        status: 'PENDING',
        items: { create: items },
      },
      include: { items: true, client: true, tenant: true },
    });

    this.logger.log(`Fatura criada ID: ${invoice.id}`);
    return invoice;
  }

  private async generatePdfNow(invoice: any) {
    try {
      const pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(invoice);
      // 🔥 CORREÇÃO: usar o número da fatura (invoice.number) em vez do ID numérico
      const pdfKey = `${invoice.tenantId}/invoices/${invoice.number}.pdf`;
      const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl, pdfKey, pdfStatus: 'generated', pdfGeneratedAt: new Date() },
      });
      this.logger.log(`PDF gerado fatura ${invoice.id}`);
      return { pdfUrl, pdfKey };
    } catch (error) {
      this.logger.error(`Erro PDF fatura ${invoice.id}: ${error.message}`);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfStatus: 'failed' },
      });
      throw new BadRequestException('Erro ao gerar PDF. Tente novamente mais tarde.');
    }
  }

  private async ensurePdf(invoiceId: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');

    if (invoice.pdfUrl && invoice.pdfKey) {
      return { pdfUrl: invoice.pdfUrl, pdfKey: invoice.pdfKey };
    }

    const fullInvoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, items: true, tenant: true },
    });
    return this.generatePdfNow(fullInvoice);
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where: { tenantId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { client: true, items: true, tenant: true },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    return invoice;
  }

  async update(id: number, tenantId: string, data: any) {
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.status !== undefined) updateData.status = data.status as InvoiceStatus;
    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true, items: true },
    });
  }

  async remove(id: number, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);
    if (invoice.pdfKey) await this.storageService.deleteFile(invoice.pdfKey).catch(() => {});
    await this.prisma.invoice.delete({ where: { id } });
    return { success: true };
  }

  async generateShareLink(invoiceId: number, tenantId: string): Promise<{ shareUrl: string }> {
    const invoice = await this.findOne(invoiceId, tenantId);
    await this.ensurePdf(invoiceId);

    const existingShare = await this.prisma.publicShare.findFirst({
      where: { resourceId: invoiceId, type: 'INVOICE', tenantId: invoice.tenantId, expiresAt: { gt: new Date() } },
    });
    let token: string;
    if (existingShare) {
      token = existingShare.token;
    } else {
      token = randomBytes(32).toString('hex');
      await this.prisma.publicShare.create({
        data: { token, type: 'INVOICE', resourceId: invoiceId, tenantId: invoice.tenantId, expiresAt: new Date(Date.now() + 7 * 86400000) },
      });
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
    const shareUrl = `${baseUrl}/public/invoices/share/${token}`;
    return { shareUrl };
  }

  async sendToWhatsApp(id: number, tenantId: string, phoneNumber: string) {
    const invoice = await this.findOne(id, tenantId);
    await this.ensurePdf(id);
    const { shareUrl } = await this.generateShareLink(id, tenantId);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const message = `📄 *FATURA MECPRO #${invoice.number}*\n👤 *Cliente:* ${invoice.client?.name || '-'}\n🚗 *Veículo:* ${invoice.client?.vehicle || '-'}\n💰 *Total:* R$ ${Number(invoice.total).toFixed(2)}\n🔗 *Link:* ${shareUrl}\n${invoice.tenant?.name || 'MecPro'} - Gestão para Oficinas`;
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    return { success: true, whatsappUrl };
  }

  async resendPdf(id: number, tenantId: string) {
    await this.ensurePdf(id);
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    return { success: true, pdfUrl: invoice?.pdfUrl };
  }
}