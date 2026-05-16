import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import { Prisma, EstimateStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);
  private pdfGeneratingLocks = new Set<number>();

  constructor(
    private prisma: PrismaService,
    private estimatesPdfService: EstimatesPdfService,
    private storageService: StorageService,
  ) {}

  private calculate(items: any[]) {
    let total = new Prisma.Decimal(0);
    const normalized = items.map((item) => {
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
    return { items: normalized, total };
  }

  async create(tenantId: string, data: any) {
    const { clientId, items: inputItems, date } = data;

    if (!tenantId) throw new BadRequestException('TenantId não informado');
    if (!clientId) throw new BadRequestException('Cliente não informado');
    if (!inputItems?.length) throw new BadRequestException('Orçamento sem itens');

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
    });
    if (!client) throw new BadRequestException('Cliente não encontrado ou não pertence ao seu tenant');

    const { items, total } = this.calculate(inputItems);
    const estimateDate = date ? new Date(date) : new Date();

    try {
      const estimate = await this.prisma.estimate.create({
        data: {
          tenantId,
          clientId,
          total,
          status: 'DRAFT',
          date: estimateDate,
          items: { create: items },
        },
        include: { items: true, client: true, tenant: true },
      });

      this.logger.log(`Orçamento criado com ID: ${estimate.id}`);
      return estimate;
    } catch (error) {
      this.logger.error(`Erro ao criar orçamento: ${error.message}`, error.stack);
      if (error.code === 'P2003') throw new BadRequestException('Cliente ou Tenant inválido');
      throw new InternalServerErrorException('Erro interno ao criar orçamento');
    }
  }

  private async generatePdfNow(estimate: any) {
    const estimateId = estimate.id;

    if (this.pdfGeneratingLocks.has(estimateId)) {
      this.logger.log(`⏳ PDF para orçamento ${estimateId} já está sendo gerado. Aguardando...`);
      let attempts = 0;
      while (this.pdfGeneratingLocks.has(estimateId) && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      const updatedEstimate = await this.prisma.estimate.findUnique({
        where: { id: estimateId },
      });
      if (updatedEstimate?.pdfUrl) {
        return { pdfUrl: updatedEstimate.pdfUrl, pdfKey: updatedEstimate.pdfKey };
      }
    }

    this.pdfGeneratingLocks.add(estimateId);

    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: estimate.tenantId },
      });

      const fullEstimate = await this.prisma.estimate.findUnique({
        where: { id: estimate.id },
        include: { client: true, items: true },
      });

      const estimateWithUpdatedTenant = {
        ...fullEstimate,
        tenant: tenant,
      };

      const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(estimateWithUpdatedTenant);
      const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;
      const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);

      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: {
          pdfUrl,
          pdfKey,
          pdfStatus: 'generated',
          pdfGeneratedAt: new Date(),
        },
      });
      this.logger.log(`PDF gerado para orçamento ${estimate.id}`);
      return { pdfUrl, pdfKey };
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF para orçamento ${estimate.id}: ${error.message}`);
      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: { pdfStatus: 'failed' },
      }).catch(e => this.logger.error(e.message));
      throw new BadRequestException('Erro ao gerar PDF. Tente novamente mais tarde.');
    } finally {
      this.pdfGeneratingLocks.delete(estimateId);
    }
  }

  private async ensurePdf(estimateId: number, forceRegenerate = false) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: estimateId },
      include: { client: true, items: true, tenant: true },
    });
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');

    if (forceRegenerate) {
      return this.generatePdfNow(estimate);
    }

    const currentTenant = await this.prisma.tenant.findUnique({
      where: { id: estimate.tenantId },
    });

    const oldTenant = estimate.tenant;
    const tenantChanged =
      oldTenant?.name !== currentTenant?.name ||
      oldTenant?.address !== currentTenant?.address ||
      oldTenant?.phone !== currentTenant?.phone ||
      oldTenant?.email !== currentTenant?.email ||
      oldTenant?.logoUrl !== currentTenant?.logoUrl;

    if (!estimate.pdfUrl || tenantChanged) {
      this.logger.log(`Regenerando PDF para orçamento ${estimate.id} (dados da oficina alterados ou sem PDF)`);
      return this.generatePdfNow(estimate);
    }

    return { pdfUrl: estimate.pdfUrl, pdfKey: estimate.pdfKey };
  }

  // ✅ LISTAGEM PRINCIPAL (oculta convertidos)
  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      tenantId,
      deletedAt: null,
      status: { not: 'CONVERTED' }, // 🔥 oculta orçamentos convertidos
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.estimate.findMany({
        where,
        skip,
        take: safeLimit,
        include: { client: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.estimate.count({ where }),
    ]);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // ✅ HISTÓRICO DE CONVERTIDOS (apenas leitura, lista com fatura anexada)
  async findConverted(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      tenantId,
      deletedAt: null,
      status: 'CONVERTED',
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.estimate.findMany({
        where,
        skip,
        take: safeLimit,
        include: {
          client: true,
          items: true,
          invoice: true, // traz a fatura gerada
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.estimate.count({ where }),
    ]);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: number, tenantId: string) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { client: true, items: true, tenant: true, invoice: true },
    });
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');
    return estimate;
  }

  // ✅ UPDATE com bloqueio de orçamentos convertidos
  async update(id: number, tenantId: string, data: any) {
    const estimate = await this.findOne(id, tenantId);
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');

    // Impedir edição de orçamentos já convertidos
    if (estimate.status === 'CONVERTED') {
      throw new BadRequestException('Orçamento convertido não pode ser alterado');
    }

    const { clientId, items: inputItems, date, status } = data;

    return await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (clientId !== undefined && clientId !== estimate.clientId) {
        const client = await tx.client.findFirst({
          where: { id: clientId, tenantId },
        });
        if (!client) throw new BadRequestException('Cliente não pertence ao tenant');
        updateData.clientId = clientId;
      }

      if (date) updateData.date = new Date(date);
      if (status) updateData.status = status;

      let itemsChanged = false;
      if (inputItems && inputItems.length > 0) {
        const { items, total } = this.calculate(inputItems);
        await tx.estimateItem.deleteMany({ where: { estimateId: id } });
        updateData.items = { create: items };
        updateData.total = total;
        itemsChanged = true;
      }

      if (Object.keys(updateData).length === 0) return estimate;

      const updatedEstimate = await tx.estimate.update({
        where: { id },
        data: updateData,
        include: { client: true, items: true },
      });

      if (itemsChanged) {
        await tx.estimate.update({
          where: { id },
          data: { pdfUrl: null, pdfKey: null, pdfStatus: 'pending', pdfGeneratedAt: null },
        });
      }

      return updatedEstimate;
    });
  }

  // ✅ CONVERSÃO (já existente, com lock e sequência – mantido)
  async convertToInvoice(estimateId: number, tenantId: string) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const lockedEstimate = await tx.$queryRaw`
            SELECT * FROM "Estimate" 
            WHERE id = ${estimateId} AND "tenantId" = ${tenantId}
            FOR UPDATE
          `;

          const estimate = (lockedEstimate as any[])[0];

          if (!estimate) {
            throw new NotFoundException('Orçamento não encontrado');
          }

          if (estimate.status === 'CONVERTED') {
            throw new ConflictException('Orçamento já foi convertido');
          }

          if (estimate.status !== 'DRAFT' && estimate.status !== 'APPROVED') {
            throw new BadRequestException('Status inválido para conversão. Apenas rascunho ou aprovado podem ser convertidos.');
          }

          const items = await tx.estimateItem.findMany({
            where: { estimateId: estimate.id },
          });

          try {
            await tx.$executeRaw`CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 100000 INCREMENT 1`;
          } catch (e) { }

          const seqResult = await tx.$queryRaw<[{ nextval: bigint }]>`
            SELECT nextval('invoice_number_seq') as nextval
          `;
          const invoiceNumber = `FAT-${seqResult[0].nextval}`;

          const invoice = await tx.invoice.create({
            data: {
              tenantId: estimate.tenantId,
              clientId: estimate.clientId,
              total: estimate.total,
              status: 'PENDING',
              number: invoiceNumber,
              estimateId: estimate.id,
              items: {
                create: items.map(item => ({
                  description: item.description,
                  quantity: item.quantity,
                  price: item.price,
                  total: item.total,
                  issPercent: item.issPercent,
                })),
              },
            },
            include: { items: true, client: true },
          });

          await tx.estimate.update({
            where: { id: estimateId },
            data: { status: 'CONVERTED' },
          });

          this.logger.log(`✅ Orçamento ${estimateId} convertido para fatura ${invoice.number}`);
          return invoice;
        });
      } catch (error: any) {
        if (error.code === 'P2002' && retries < maxRetries - 1) {
          retries++;
          this.logger.warn(`⚠️ Conflito de número de fatura, tentativa ${retries} de ${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 100 * retries));
          continue;
        }
        this.logger.error(`Erro na conversão: ${error.message}`);
        throw error;
      }
    }

    throw new InternalServerErrorException('Erro na conversão após múltiplas tentativas');
  }

  // ✅ SOFT DELETE (permite excluir até convertidos, mas respeita tenant)
  async remove(id: number, tenantId: string) {
    const estimate = await this.findOne(id, tenantId);
    if (estimate.pdfKey) {
      await this.storageService.deleteFile(estimate.pdfKey).catch(() => { });
    }
    await this.prisma.estimate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async generateShareLink(estimateId: number, tenantId: string): Promise<{ shareUrl: string }> {
    const estimate = await this.findOne(estimateId, tenantId);
    await this.ensurePdf(estimateId);

    const existingShare = await this.prisma.publicShare.findFirst({
      where: { resourceId: estimateId, type: 'ESTIMATE', tenantId, expiresAt: { gt: new Date() } },
    });

    let token: string;
    if (existingShare) {
      token = existingShare.token;
    } else {
      const newShare = await this.prisma.publicShare.create({
        data: {
          token: randomBytes(32).toString('hex'),
          type: 'ESTIMATE',
          resourceId: estimateId,
          tenantId: estimate.tenantId,
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      token = newShare.token;
    }

    const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
    const shareUrl = `${baseUrl}/public/estimates/share/${token}`;
    return { shareUrl };
  }

  async sendToWhatsApp(id: number, tenantId: string, phoneNumber: string) {
    const estimate = await this.findOne(id, tenantId);
    await this.ensurePdf(id);
    const { shareUrl } = await this.generateShareLink(id, tenantId);

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new BadRequestException('Número de telefone inválido. Deve ter 10 ou 11 dígitos.');
    }

    const finalPhone = cleanPhone.length === 10 ? `55${cleanPhone}` :
      cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const message = `📄 *ORÇAMENTO MECPRO #${estimate.id}*\n👤 *Cliente:* ${estimate.client?.name || '-'}\n🚗 *Veículo:* ${estimate.client?.vehicle || '-'}\n💰 *Total:* R$ ${Number(estimate.total).toFixed(2)}\n🔗 *Link:* ${shareUrl}\n${estimate.tenant?.name || 'MecPro'} - Sua oficina de confiança`;
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

    this.logger.log(`📱 Link do WhatsApp gerado para ${finalPhone}`);

    return { success: true, whatsappUrl, phoneNumber: finalPhone };
  }

  async resendPdf(id: number, tenantId: string) {
    await this.ensurePdf(id, true);
    const estimate = await this.prisma.estimate.findUnique({ where: { id } });
    return { success: true, pdfUrl: estimate?.pdfUrl };
  }
}