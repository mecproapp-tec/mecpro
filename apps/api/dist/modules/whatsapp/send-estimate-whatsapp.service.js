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
var SendEstimateWhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEstimateWhatsappService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const public_share_service_1 = require("../public-share/public-share.service");
const whatsapp_service_1 = require("./whatsapp.service");
let SendEstimateWhatsappService = SendEstimateWhatsappService_1 = class SendEstimateWhatsappService {
    constructor(prisma, publicShareService, whatsappService) {
        this.prisma = prisma;
        this.publicShareService = publicShareService;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(SendEstimateWhatsappService_1.name);
    }
    async execute(estimateId) {
        const estimate = await this.prisma.estimate.findUnique({
            where: { id: estimateId },
            include: { client: true, tenant: true },
        });
        if (!estimate)
            throw new common_1.NotFoundException('Orçamento não encontrado');
        if (!estimate.client?.phone)
            throw new common_1.NotFoundException('Cliente sem telefone');
        let shareToken = estimate.shareToken;
        if (!shareToken) {
            const share = await this.publicShareService.create({
                tenantId: estimate.tenantId,
                type: 'ESTIMATE',
                resourceId: estimate.id,
                expiresInDays: 30,
            });
            shareToken = share.token;
            await this.prisma.estimate.update({
                where: { id: estimate.id },
                data: { shareToken, shareTokenExpires: share.expiresAt },
            });
        }
        const shareUrl = this.whatsappService.getShareLink(shareToken, 'estimate');
        const message = this.whatsappService.generateEstimateMessage(estimate, shareUrl);
        const whatsappUrl = this.whatsappService.generateWhatsAppLink(estimate.client.phone, message);
        this.logger.log(`Link WhatsApp gerado para orçamento ${estimate.id}: ${whatsappUrl}`);
        return {
            success: true,
            whatsappUrl,
            shareUrl,
            message,
            clientPhone: estimate.client.phone,
        };
    }
};
exports.SendEstimateWhatsappService = SendEstimateWhatsappService;
exports.SendEstimateWhatsappService = SendEstimateWhatsappService = SendEstimateWhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        public_share_service_1.PublicShareService,
        whatsapp_service_1.WhatsappService])
], SendEstimateWhatsappService);
//# sourceMappingURL=send-estimate-whatsapp.service.js.map