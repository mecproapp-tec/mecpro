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
var SendInvoiceWhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendInvoiceWhatsappService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const public_share_service_1 = require("../public-share/public-share.service");
const whatsapp_service_1 = require("./whatsapp.service");
let SendInvoiceWhatsappService = SendInvoiceWhatsappService_1 = class SendInvoiceWhatsappService {
    constructor(prisma, publicShareService, whatsappService) {
        this.prisma = prisma;
        this.publicShareService = publicShareService;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(SendInvoiceWhatsappService_1.name);
    }
    async execute(invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true, tenant: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Fatura não encontrada');
        if (!invoice.client?.phone)
            throw new common_1.NotFoundException('Cliente sem telefone');
        let shareToken = invoice.shareToken;
        if (!shareToken) {
            const share = await this.publicShareService.create({
                tenantId: invoice.tenantId,
                type: 'INVOICE',
                resourceId: invoice.id,
                expiresInDays: 30,
            });
            shareToken = share.token;
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: { shareToken, shareTokenExpires: share.expiresAt },
            });
        }
        const shareUrl = this.whatsappService.getShareLink(shareToken, 'invoice');
        const message = this.whatsappService.generateInvoiceMessage(invoice, shareUrl);
        const whatsappUrl = this.whatsappService.generateWhatsAppLink(invoice.client.phone, message);
        this.logger.log(`Link WhatsApp gerado para fatura ${invoice.number}: ${whatsappUrl}`);
        return {
            success: true,
            whatsappUrl,
            shareUrl,
            message,
            clientPhone: invoice.client.phone,
        };
    }
};
exports.SendInvoiceWhatsappService = SendInvoiceWhatsappService;
exports.SendInvoiceWhatsappService = SendInvoiceWhatsappService = SendInvoiceWhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        public_share_service_1.PublicShareService,
        whatsapp_service_1.WhatsappService])
], SendInvoiceWhatsappService);
//# sourceMappingURL=send-invoice-whatsapp.service.js.map