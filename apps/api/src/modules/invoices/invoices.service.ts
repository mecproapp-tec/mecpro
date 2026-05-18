// apps/api/src/modules/invoices/invoices.service.ts
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

  // 🔥 CORREÇÃO: Método calculate agora inclui ISS igual ao do orçamento
  private calculate(items: any[]) {
    let total = new Prisma.Decimal(0);

    const normalizedItems = items.map((item) => {
      const priceValue = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const price = new Prisma.Decimal(isNaN(priceValue) ? 0 : priceValue);
      const quantity = new Prisma.Decimal(item.quantity || 1);
      const issPercent = new Prisma.Decimal(item.issPercent || 0);

      const subtotal = price.times(quantity);
      const tax = subtotal.times(issPercent).dividedBy(100);
      const itemTotal = subtotal.plus(tax);

      total = total.plus(itemTotal);

      return {
        description: item.description || '-',
        quantity: quantity.toNumber(),
        price,
        issPercent: issPercent.toNumber(),
        total: itemTotal,
      };
    });

    return {
      items: normalizedItems,
      total,
    };
  }

  async create(tenantId: string, data: any) {
    const { clientId, items: inputItems, date } = data;
    
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
    const invoiceDate = date ? new Date(date) : new Date();

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        clientId,
        number: invoiceNumber,
        total,
        status: 'PENDING',
        createdAt: invoiceDate,
        items: { create: items },
      },
      include: { items: true, client: true, tenant: true },
    });

    this.logger.log(`Fatura criada ID: ${invoice.id}, Total: ${total}`);
    return invoice;
  }

  private async generatePdfNow(invoice: any) {
    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: invoice.tenantId } });
      const fullInvoice = await this.prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { client: true, items: true },
      });
      const invoiceWithUpdatedTenant = { ...fullInvoice, tenant };
      const pdfBuffer = await this.invoicesPdfService.generateInvoicePdf(invoiceWithUpdatedTenant);
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
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfStatus: 'failed' } });
      throw new BadRequestException('Erro ao gerar PDF. Tente novamente mais tarde.');
    }
  }

  private async ensurePdf(invoiceId: number, forceRegenerate = false) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, items: true, tenant: true },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');

    if (forceRegenerate) {
      return this.generatePdfNow(invoice);
    }

    const currentTenant = await this.prisma.tenant.findUnique({ where: { id: invoice.tenantId } });
    const oldTenant = invoice.tenant;
    const tenantChanged =
      oldTenant?.name !== currentTenant?.name ||
      oldTenant?.address !== currentTenant?.address ||
      oldTenant?.phone !== currentTenant?.phone ||
      oldTenant?.email !== currentTenant?.email ||
      oldTenant?.logoUrl !== currentTenant?.logoUrl;

    if (!invoice.pdfUrl || tenantChanged) {
      this.logger.log(`Regenerando PDF para fatura ${invoice.id} (dados da oficina alterados ou sem PDF)`);
      return this.generatePdfNow(invoice);
    }
    return { pdfUrl: invoice.pdfUrl, pdfKey: invoice.pdfKey };
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take: safeLimit,
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
    ]);
    return { data, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  async findOne(id: number, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId, deletedAt: null },
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
    await this.prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
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
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new BadRequestException('Número de telefone inválido. Deve ter 10 ou 11 dígitos.');
    }
    const finalPhone = cleanPhone.length === 10 ? `55${cleanPhone}` : (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`);

    const message = `📄 *FATURA MECPRO #${invoice.number}*\n👤 *Cliente:* ${invoice.client?.name || '-'}\n🚗 *Veículo:* ${invoice.client?.vehicle || '-'}\n💰 *Total:* R$ ${Number(invoice.total).toFixed(2)}\n🔗 *Link:* ${shareUrl}\n${invoice.tenant?.name || 'MecPro'} - Gestão para Oficinas`;

    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

    this.logger.log(`📱 Link WhatsApp gerado para fatura ${invoice.number}`);
    return { success: true, whatsappUrl };
  }

  async resendPdf(id: number, tenantId: string) {
    await this.ensurePdf(id, true);
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    return { success: true, pdfUrl: invoice?.pdfUrl };
  }
}