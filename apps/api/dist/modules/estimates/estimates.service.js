"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EstimatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const estimates_pdf_service_1 = require("./estimates-pdf.service");
const storage_service_1 = require("../storage/storage.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let EstimatesService = EstimatesService_1 = class EstimatesService {
    constructor(prisma, estimatesPdfService, storageService) {
        this.prisma = prisma;
        this.estimatesPdfService = estimatesPdfService;
        this.storageService = storageService;
        this.logger = new common_1.Logger(EstimatesService_1.name);
        this.pdfGeneratingLocks = new Set();
    }
    calculate(items) {
        let total = new client_1.Prisma.Decimal(0);
        const normalized = items.map((item) => {
            const priceValue = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            const price = new client_1.Prisma.Decimal(isNaN(priceValue) ? 0 : priceValue);
            const quantity = new client_1.Prisma.Decimal(item.quantity || 1);
            const issPercent = new client_1.Prisma.Decimal(item.issPercent || 0);
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
    async create(tenantId, data) {
        const { clientId, items: inputItems, date } = data;
        if (!tenantId)
            throw new common_1.BadRequestException('TenantId não informado');
        if (!clientId)
            throw new common_1.BadRequestException('Cliente não informado');
        if (!inputItems?.length)
            throw new common_1.BadRequestException('Orçamento sem itens');
        const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client)
            throw new common_1.BadRequestException('Cliente não encontrado ou não pertence ao seu tenant');
        const { items, total } = this.calculate(inputItems);
        const estimateDate = date ? new Date(date) : new Date();
        try {
            const estimate = await this.prisma.estimate.create({
                data: {
                    tenantId,
                    clientId,
                    total,
                    status: client_1.EstimateStatus.DRAFT,
                    date: estimateDate,
                    pdfStatus: 'pending',
                    items: { create: items },
                },
                include: { items: true, client: true, tenant: true },
            });
            this.logger.log(`✅ Orçamento criado com ID: ${estimate.id}`);
            return estimate;
        }
        catch (error) {
            this.logger.error(`❌ Erro ao criar orçamento: ${error.message}`, error.stack);
            if (error.code === 'P2003')
                throw new common_1.BadRequestException('Cliente ou Tenant inválido');
            throw new common_1.InternalServerErrorException('Erro interno ao criar orçamento');
        }
    }
    async generatePdfNow(estimate) {
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
        }
        catch (error) {
            this.logger.error(`❌ Erro ao gerar PDF ${estimate.id}: ${error.message}`);
            await this.prisma.estimate.update({ where: { id: estimate.id }, data: { pdfStatus: 'failed' } }).catch((e) => this.logger.error(e.message));
            throw new common_1.BadRequestException('Erro ao gerar PDF. Tente novamente.');
        }
        finally {
            this.pdfGeneratingLocks.delete(estimateId);
        }
    }
    async ensurePdf(estimateId, forceRegenerate = false) {
        const estimate = await this.prisma.estimate.findUnique({
            where: { id: estimateId },
            include: { client: true, items: true, tenant: true },
        });
        if (!estimate)
            throw new common_1.NotFoundException('Orçamento não encontrado');
        if (forceRegenerate)
            return this.generatePdfNow(estimate);
        const currentTenant = await this.prisma.tenant.findUnique({ where: { id: estimate.tenantId } });
        const oldTenant = estimate.tenant;
        const tenantChanged = oldTenant?.name !== currentTenant?.name ||
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
    async findAll(tenantId, page = 1, limit = 50) {
        if (!tenantId)
            throw new common_1.BadRequestException('TenantId inválido');
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
        const skip = (safePage - 1) * safeLimit;
        const where = { tenantId, deletedAt: null, status: { not: client_1.EstimateStatus.CONVERTED } };
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
    async findConverted(tenantId, page = 1, limit = 50) {
        if (!tenantId)
            throw new common_1.BadRequestException('TenantId inválido');
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
        const skip = (safePage - 1) * safeLimit;
        const where = { tenantId, deletedAt: null, status: client_1.EstimateStatus.CONVERTED };
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
    async findOne(id, tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('TenantId inválido');
        const estimate = await this.prisma.estimate.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: { client: true, items: true, tenant: true, invoice: true },
        });
        if (!estimate)
            throw new common_1.NotFoundException('Orçamento não encontrado');
        return estimate;
    }
    async update(id, tenantId, data) {
        const estimate = await this.findOne(id, tenantId);
        if (estimate.status === client_1.EstimateStatus.CONVERTED) {
            throw new common_1.BadRequestException('Orçamento convertido não pode ser alterado');
        }
        const { clientId, items: inputItems, date, status } = data;
        return await this.prisma.$transaction(async (tx) => {
            const updateData = {};
            if (clientId !== undefined && clientId !== estimate.clientId) {
                const client = await tx.client.findFirst({ where: { id: clientId, tenantId } });
                if (!client)
                    throw new common_1.BadRequestException('Cliente não pertence ao tenant');
                updateData.clientId = clientId;
            }
            if (date)
                updateData.date = new Date(date);
            if (status)
                updateData.status = status;
            let itemsChanged = false;
            if (inputItems && inputItems.length > 0) {
                const { items, total } = this.calculate(inputItems);
                await tx.estimateItem.deleteMany({ where: { estimateId: id } });
                updateData.items = { create: items };
                updateData.total = total;
                itemsChanged = true;
            }
            if (Object.keys(updateData).length === 0)
                return estimate;
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
    async convertToInvoice(estimateId, tenantId) {
        let retries = 0;
        const maxRetries = 3;
        while (retries < maxRetries) {
            try {
                return await this.prisma.$transaction(async (tx) => {
                    const lockedEstimate = await tx.$queryRaw `SELECT * FROM "Estimate" WHERE id = ${estimateId} AND "tenantId" = ${tenantId} FOR UPDATE`;
                    const estimate = lockedEstimate[0];
                    if (!estimate)
                        throw new common_1.NotFoundException('Orçamento não encontrado');
                    if (estimate.status === client_1.EstimateStatus.CONVERTED)
                        throw new common_1.ConflictException('Orçamento já convertido');
                    if (estimate.status !== client_1.EstimateStatus.DRAFT && estimate.status !== client_1.EstimateStatus.APPROVED) {
                        throw new common_1.BadRequestException('Status inválido para conversão');
                    }
                    const items = await tx.estimateItem.findMany({ where: { estimateId: estimate.id } });
                    try {
                        await tx.$executeRaw `CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 100000 INCREMENT 1`;
                    }
                    catch (e) { }
                    const seqResult = await tx.$queryRaw `SELECT nextval('invoice_number_seq') as nextval`;
                    const invoiceNumber = `FAT-${seqResult[0].nextval}`;
                    const invoice = await tx.invoice.create({
                        data: {
                            tenantId: estimate.tenantId,
                            clientId: estimate.clientId,
                            total: estimate.total,
                            status: 'PENDING',
                            number: invoiceNumber,
                            estimateId: estimate.id,
                            items: { create: items.map((item) => ({ ...item, id: undefined })) },
                        },
                        include: { items: true, client: true },
                    });
                    await tx.estimate.update({ where: { id: estimateId }, data: { status: client_1.EstimateStatus.CONVERTED } });
                    this.logger.log(`✅ Orçamento ${estimateId} convertido para ${invoice.number}`);
                    return invoice;
                });
            }
            catch (error) {
                if (error.code === 'P2002' && retries < maxRetries - 1) {
                    retries++;
                    this.logger.warn(`⚠️ Tentativa ${retries}/${maxRetries}`);
                    await new Promise((resolve) => setTimeout(resolve, 100 * retries));
                    continue;
                }
                this.logger.error(`❌ Erro conversão: ${error.message}`);
                throw error;
            }
        }
        throw new common_1.InternalServerErrorException('Erro na conversão');
    }
    async remove(id, tenantId) {
        const estimate = await this.findOne(id, tenantId);
        if (estimate.pdfKey)
            await this.storageService.deleteFile(estimate.pdfKey).catch(() => { });
        await this.prisma.estimate.update({ where: { id }, data: { deletedAt: new Date() } });
        return { success: true };
    }
    async generateShareLink(estimateId, tenantId) {
        const estimate = await this.findOne(estimateId, tenantId);
        await this.ensurePdf(estimateId);
        const existingShare = await this.prisma.publicShare.findFirst({
            where: { resourceId: estimateId, type: 'ESTIMATE', tenantId, expiresAt: { gt: new Date() } },
        });
        let token;
        if (existingShare) {
            token = existingShare.token;
        }
        else {
            token = (0, crypto_1.randomBytes)(32).toString('hex');
            await this.prisma.publicShare.create({
                data: { token, type: 'ESTIMATE', resourceId: estimateId, tenantId: estimate.tenantId, expiresAt: new Date(Date.now() + 7 * 86400000) },
            });
        }
        const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
        const shareUrl = `${baseUrl}/public/estimates/share/${token}`;
        return { shareUrl };
    }
    async sendToWhatsApp(id, tenantId, phoneNumber) {
        const estimate = await this.findOne(id, tenantId);
        await this.ensurePdf(id);
        const { shareUrl } = await this.generateShareLink(id, tenantId);
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) {
            throw new common_1.BadRequestException('Número inválido');
        }
        const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        const message = `📄 *ORÇAMENTO MECPRO #${estimate.id}*\n` +
            `👤 Cliente: ${estimate.client?.name || '-'}\n` +
            `🚗 Veículo: ${estimate.client?.vehicle || '-'}\n` +
            `💰 Total: R$ ${Number(estimate.total).toFixed(2)}\n` +
            `🔗 ${shareUrl}\n\n` +
            `${estimate.tenant?.name || 'MecPro'}`;
        const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
        this.logger.log(`📱 Link WhatsApp gerado: ${finalPhone}`);
        return { success: true, whatsappUrl, phoneNumber: finalPhone };
    }
    async resendPdf(id, tenantId) {
        await this.ensurePdf(id, true);
        const estimate = await this.prisma.estimate.findUnique({ where: { id } });
        return { success: true, pdfUrl: estimate?.pdfUrl };
    }
};
exports.EstimatesService = EstimatesService;
exports.EstimatesService = EstimatesService = EstimatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        estimates_pdf_service_1.EstimatesPdfService,
        storage_service_1.StorageService])
], EstimatesService);
//# sourceMappingURL=estimates.service.js.map