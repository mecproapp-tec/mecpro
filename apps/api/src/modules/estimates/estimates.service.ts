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
import { Prisma, EstimateStatus, InvoiceStatus } from '@prisma/client';
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

    const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new BadRequestException('Cliente não encontrado ou não pertence ao seu tenant');

    const { items, total } = this.calculate(inputItems);
    const estimateDate = date ? new Date(date) : new Date();

    try {
      const estimate = await this.prisma.estimate.create({
        data: {
          tenantId,
          clientId,
          total,
          status: EstimateStatus.DRAFT,
          date: estimateDate,
          pdfStatus: 'pending',
          items: { create: items },
        },
        include: { items: true, client: true, tenant: true },
      });
      this.logger.log(`✅ Orçamento criado com ID: ${estimate.id}`);
      return estimate;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao criar orçamento: ${error.message}`, error.stack);
      if (error.code === 'P2003') throw new BadRequestException('Cliente ou Tenant inválido');
      throw new InternalServerErrorException('Erro interno ao criar orçamento');
    }
  }

  private async generatePdfNow(estimate: any) {
    const estimateId = estimate.id;
    if (this.pdfGeneratingLocks.has(estimateId)) {
      this.logger.log(`⏳ PDF do orçamento ${estimateId} já está sendo gerado`);
      let attempts = 0;
      while (this.pdfGeneratingLocks.has(estimateId) && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }
      const updatedEstimate = await this.prisma.estimate.findUnique({ where: { id: estimateId } });
      if (updatedEstimate?.pdfUrl) {
        return { pdfUrl: updatedEstimate.pdfUrl, pdfKey: updatedEstimate.pdfKey };
      }
    }

    this.pdfGeneratingLocks.add(estimateId);
    try {
      await this.prisma.estimate.update({ where: { id: estimateId }, data: { pdfStatus: 'generating' } });
      const tenant = await this.prisma.tenant.findUnique({ where: { id: estimate.tenantId } });
      const fullEstimate = await this.prisma.estimate.findUnique({
        where: { id: estimate.id },
        include: { client: true, items: true },
      });
      const estimateWithUpdatedTenant = { ...fullEstimate, tenant };
      const pdfBuffer = await this.estimatesPdfService.generateEstimatePdf(estimateWithUpdatedTenant);
      const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;
      const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
      await this.prisma.estimate.update({
        where: { id: estimate.id },
        data: { pdfUrl, pdfKey, pdfStatus: 'generated', pdfGeneratedAt: new Date() },
      });
      this.logger.log(`✅ PDF gerado para orçamento ${estimate.id}`);
      return { pdfUrl, pdfKey };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao gerar PDF ${estimate.id}: ${error.message}`);
      await this.prisma.estimate.update({ where: { id: estimate.id }, data: { pdfStatus: 'failed' } }).catch((e) => this.logger.error(e.message));
      throw new BadRequestException('Erro ao gerar PDF. Tente novamente.');
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
    if (forceRegenerate) return this.generatePdfNow(estimate);

    const currentTenant = await this.prisma.tenant.findUnique({ where: { id: estimate.tenantId } });
    const oldTenant = estimate.tenant;
    const tenantChanged =
      oldTenant?.name !== currentTenant?.name ||
      oldTenant?.address !== currentTenant?.address ||
      oldTenant?.phone !== currentTenant?.phone ||
      oldTenant?.email !== currentTenant?.email ||
      oldTenant?.logoUrl !== currentTenant?.logoUrl;

    if (!estimate.pdfUrl || tenantChanged) {
      this.logger.log(`♻️ Regenerando PDF do orçamento ${estimate.id}`);
      return this.generatePdfNow(estimate);
    }
    return { pdfUrl: estimate.pdfUrl, pdfKey: estimate.pdfKey };
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;
    const where = { tenantId, deletedAt: null, status: { not: EstimateStatus.CONVERTED } };
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
    return { data, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  }

  async findConverted(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) throw new BadRequestException('TenantId inválido');
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;
    const where = { tenantId, deletedAt: null, status: EstimateStatus.CONVERTED };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.estimate.findMany({
        where,
        skip,
        take: safeLimit,
        include: { client: true, items: true, invoice: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.estimate.count({ where }),
    ]);
    return { data, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
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

  async update(id: number, tenantId: string, data: any) {
    const estimate = await this.findOne(id, tenantId);
    if (estimate.status === EstimateStatus.CONVERTED) {
      throw new BadRequestException('Orçamento convertido não pode ser alterado');
    }
    const { clientId, items: inputItems, date, status } = data;
    return await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (clientId !== undefined && clientId !== estimate.clientId) {
        const client = await tx.client.findFirst({ where: { id: clientId, tenantId } });
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

  /**
   * 🔥 CONVERSÃO CORRIGIDA E OTIMIZADA
   * - Sem o erro "Unknown argument tenantId" porque NÃO passa tenantId no findMany de items
   * - Utiliza FOR UPDATE para lock pessimista
   * - Geração profissional de número de fatura (ANO/SEQ)
   * - Transação com retry e isolamento serializável
   */
  async convertToInvoice(estimateId: number, tenantId: string) {
    this.logger.log(`🔄 Iniciando conversão do orçamento ${estimateId} (tenant ${tenantId})`);

    if (!estimateId || estimateId <= 0) {
      throw new BadRequestException('ID do orçamento inválido');
    }
    if (!tenantId?.trim()) {
      throw new BadRequestException('Tenant ID inválido');
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          // 1. Lock pessimista no orçamento
          const lockedEstimate = await tx.$queryRaw<any[]>`
            SELECT * FROM "Estimate"
            WHERE id = ${estimateId}
              AND "tenantId" = ${tenantId}
              AND "deletedAt" IS NULL
            FOR UPDATE
          `;

          if (!lockedEstimate || lockedEstimate.length === 0) {
            throw new NotFoundException('Orçamento não encontrado');
          }
          const estimate = lockedEstimate[0];

          // 2. Validações de status
          if (estimate.status === EstimateStatus.CONVERTED) {
            throw new ConflictException('Orçamento já foi convertido em fatura');
          }
          if (![EstimateStatus.DRAFT, EstimateStatus.APPROVED, EstimateStatus.SENT].includes(estimate.status)) {
            throw new BadRequestException(`Orçamento com status ${estimate.status} não pode ser convertido`);
          }

          // 3. Verificar se já existe fatura vinculada
          const existingInvoice = await tx.invoice.findUnique({
            where: { estimateId: estimate.id },
          });
          if (existingInvoice) {
            throw new ConflictException(`Este orçamento já possui a fatura ${existingInvoice.number}`);
          }

          // 4. Buscar itens do orçamento (sem tenantId - campo não existe em EstimateItem)
          const items = await tx.estimateItem.findMany({
            where: { estimateId: estimate.id },
          });

          if (items.length === 0) {
            throw new BadRequestException('Orçamento sem itens não pode ser convertido');
          }

          // 5. Gerar número único de fatura (formato ANO/SEQUENCIAL)
          const invoiceNumber = await this.generateInvoiceNumber(tx, tenantId);

          // 6. Criar fatura e seus itens
          const invoice = await tx.invoice.create({
            data: {
              tenantId: estimate.tenantId,
              clientId: estimate.clientId,
              total: estimate.total,
              status: InvoiceStatus.PENDING,
              number: invoiceNumber,
              estimateId: estimate.id,
              pdfStatus: 'pending',
              items: {
                createMany: {
                  data: items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    issPercent: item.issPercent ?? null,
                  })),
                },
              },
            },
            include: { items: true, client: true },
          });

          // 7. Atualizar status do orçamento
          await tx.estimate.update({
            where: { id: estimate.id },
            data: { status: EstimateStatus.CONVERTED },
          });

          this.logger.log(`✅ Orçamento ${estimateId} convertido para fatura ${invoice.number} (ID: ${invoice.id})`);
          return invoice;

        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        });
      } catch (error: any) {
        attempt++;
        const isRetryable = error.code === 'P2002' || error.code === 'P2034' || error.message?.includes('deadlock');
        if (isRetryable && attempt < maxRetries) {
          this.logger.warn(`⚠️ Tentativa ${attempt} falhou. Retentativa em ${attempt * 200}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 200));
          continue;
        }
        this.logger.error(`❌ Erro ao converter orçamento ${estimateId}: ${error.message}`, error.stack);
        if (error.code === 'P2002') {
          throw new ConflictException('Já existe uma fatura com este número. Tente novamente.');
        }
        if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) {
          throw error;
        }
        throw new InternalServerErrorException('Falha na conversão do orçamento. Tente mais tarde.');
      }
    }
    throw new InternalServerErrorException('Máximo de tentativas excedido. Não foi possível converter.');
  }

  /**
   * Gera número único de fatura no formato ANO/SEQUENCIAL (ex: 2026/0001)
   * Atomicidade garantida pela transação atual.
   */
  private async generateInvoiceNumber(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        tenantId,
        number: { startsWith: `${year}/` },
      },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.number.split('/');
      if (parts.length === 2) {
        const lastSeq = parseInt(parts[1], 10);
        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
      }
    }

    const paddedSeq = sequence.toString().padStart(4, '0');
    const newNumber = `${year}/${paddedSeq}`;

    // Fallback extremamente raro (colisão)
    const existing = await tx.invoice.findUnique({ where: { number: newNumber } });
    if (existing) {
      return `${year}/${paddedSeq}-${Math.floor(Math.random() * 1000)}`;
    }
    return newNumber;
  }

  async remove(id: number, tenantId: string) {
    const estimate = await this.findOne(id, tenantId);
    if (estimate.pdfKey) await this.storageService.deleteFile(estimate.pdfKey).catch(() => {});
    await this.prisma.estimate.update({ where: { id }, data: { deletedAt: new Date() } });
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
      token = randomBytes(32).toString('hex');
      await this.prisma.publicShare.create({
        data: { token, type: 'ESTIMATE', resourceId: estimateId, tenantId: estimate.tenantId, expiresAt: new Date(Date.now() + 7 * 86400000) },
      });
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
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) {
      throw new BadRequestException('Número inválido');
    }
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const message =
      `📄 *ORÇAMENTO MECPRO #${estimate.id}*\n` +
      `👤 Cliente: ${estimate.client?.name || '-'}\n` +
      `🚗 Veículo: ${estimate.client?.vehicle || '-'}\n` +
      `💰 Total: R$ ${Number(estimate.total).toFixed(2)}\n` +
      `🔗 ${shareUrl}\n\n` +
      `${estimate.tenant?.name || 'MecPro'}`;

    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

    this.logger.log(`📱 Link WhatsApp gerado: ${finalPhone}`);
    return { success: true, whatsappUrl, phoneNumber: finalPhone };
  }

  async resendPdf(id: number, tenantId: string) {
    await this.ensurePdf(id, true);
    const estimate = await this.prisma.estimate.findUnique({ where: { id } });
    return { success: true, pdfUrl: estimate?.pdfUrl };
  }
}