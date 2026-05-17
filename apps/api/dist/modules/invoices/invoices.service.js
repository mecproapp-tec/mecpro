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
var InvoicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const invoices_pdf_service_1 = require("./invoices-pdf.service");
const storage_service_1 = require("../storage/storage.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let InvoicesService = InvoicesService_1 = class InvoicesService {
    constructor(prisma, invoicesPdfService, storageService) {
        this.prisma = prisma;
        this.invoicesPdfService = invoicesPdfService;
        this.storageService = storageService;
        this.logger = new common_1.Logger(InvoicesService_1.name);
    }
    calculate(items) {
        let total = new client_1.Prisma.Decimal(0);
        const normalized = items.map((item) => {
            const priceValue = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            const price = new client_1.Prisma.Decimal(isNaN(priceValue) ? 0 : priceValue);
            const quantity = new client_1.Prisma.Decimal(item.quantity || 1);
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
    async create(tenantId, data) {
        const { clientId, items: inputItems } = data;
        if (!tenantId)
            throw new common_1.BadRequestException('TenantId não informado');
        if (!clientId)
            throw new common_1.BadRequestException('Cliente não informado');
        if (!inputItems?.length)
            throw new common_1.BadRequestException('Fatura sem itens');
        const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client)
            throw new common_1.BadRequestException('Cliente não encontrado');
        const { items, total } = this.calculate(inputItems);
        const generateUniqueNumber = async (retries = 3) => {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const number = `FAT-${timestamp}${random}`;
            const existing = await this.prisma.invoice.findUnique({ where: { number } });
            if (existing && retries > 0)
                return generateUniqueNumber(retries - 1);
            if (existing)
                throw new Error('Não foi possível gerar número único');
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
    async generatePdfNow(invoice) {
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
        }
        catch (error) {
            this.logger.error(`Erro PDF fatura ${invoice.id}: ${error.message}`);
            await this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfStatus: 'failed' } });
            throw new common_1.BadRequestException('Erro ao gerar PDF. Tente novamente mais tarde.');
        }
    }
    async ensurePdf(invoiceId, forceRegenerate = false) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true, items: true, tenant: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Fatura não encontrada');
        if (forceRegenerate) {
            return this.generatePdfNow(invoice);
        }
        const currentTenant = await this.prisma.tenant.findUnique({ where: { id: invoice.tenantId } });
        const oldTenant = invoice.tenant;
        const tenantChanged = oldTenant?.name !== currentTenant?.name ||
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
    async findAll(tenantId, page = 1, limit = 50) {
        if (!tenantId)
            throw new common_1.BadRequestException('TenantId inválido');
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
    async findOne(id, tenantId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: { client: true, items: true, tenant: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Fatura não encontrada');
        return invoice;
    }
    async update(id, tenantId, data) {
        await this.findOne(id, tenantId);
        const updateData = {};
        if (data.clientId !== undefined)
            updateData.clientId = data.clientId;
        if (data.status !== undefined)
            updateData.status = data.status;
        return this.prisma.invoice.update({
            where: { id },
            data: updateData,
            include: { client: true, items: true },
        });
    }
    async remove(id, tenantId) {
        const invoice = await this.findOne(id, tenantId);
        if (invoice.pdfKey)
            await this.storageService.deleteFile(invoice.pdfKey).catch(() => { });
        await this.prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
        return { success: true };
    }
    async generateShareLink(invoiceId, tenantId) {
        const invoice = await this.findOne(invoiceId, tenantId);
        await this.ensurePdf(invoiceId);
        const existingShare = await this.prisma.publicShare.findFirst({
            where: { resourceId: invoiceId, type: 'INVOICE', tenantId: invoice.tenantId, expiresAt: { gt: new Date() } },
        });
        let token;
        if (existingShare) {
            token = existingShare.token;
        }
        else {
            token = (0, crypto_1.randomBytes)(32).toString('hex');
            await this.prisma.publicShare.create({
                data: { token, type: 'INVOICE', resourceId: invoiceId, tenantId: invoice.tenantId, expiresAt: new Date(Date.now() + 7 * 86400000) },
            });
        }
        const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
        const shareUrl = `${baseUrl}/public/invoices/share/${token}`;
        return { shareUrl };
    }
    async sendToWhatsApp(id, tenantId, phoneNumber) {
        const invoice = await this.findOne(id, tenantId);
        await this.ensurePdf(id);
        const { shareUrl } = await this.generateShareLink(id, tenantId);
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 11) {
            throw new common_1.BadRequestException('Número de telefone inválido. Deve ter 10 ou 11 dígitos.');
        }
        const finalPhone = cleanPhone.length === 10 ? `55${cleanPhone}` : (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`);
        const message = `📄 *FATURA MECPRO #${invoice.number}*\n👤 *Cliente:* ${invoice.client?.name || '-'}\n🚗 *Veículo:* ${invoice.client?.vehicle || '-'}\n💰 *Total:* R$ ${Number(invoice.total).toFixed(2)}\n🔗 *Link:* ${shareUrl}\n${invoice.tenant?.name || 'MecPro'} - Gestão para Oficinas`;
        const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
        this.logger.log(`📱 Link WhatsApp gerado para fatura ${invoice.number}`);
        return { success: true, whatsappUrl };
    }
    async resendPdf(id, tenantId) {
        await this.ensurePdf(id, true);
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        return { success: true, pdfUrl: invoice?.pdfUrl };
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = InvoicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        invoices_pdf_service_1.InvoicesPdfService,
        storage_service_1.StorageService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map