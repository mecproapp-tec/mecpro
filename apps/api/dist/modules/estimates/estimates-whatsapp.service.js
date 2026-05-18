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
var EstimatesWhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimatesWhatsappService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const estimates_pdf_service_1 = require("./estimates-pdf.service");
const storage_service_1 = require("../storage/storage.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const estimate_message_util_1 = require("./estimate-message.util");
let EstimatesWhatsappService = EstimatesWhatsappService_1 = class EstimatesWhatsappService {
    constructor(prisma, pdfService, storageService, whatsappService) {
        this.prisma = prisma;
        this.pdfService = pdfService;
        this.storageService = storageService;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(EstimatesWhatsappService_1.name);
    }
    async ensurePdf(estimate) {
        if (estimate.pdfUrl)
            return estimate;
        const pdfBuffer = await this.pdfService.generateEstimatePdf(estimate);
        const pdfKey = `${estimate.tenantId}/estimates/${estimate.id}.pdf`;
        const pdfUrl = await this.storageService.uploadPdf(pdfBuffer, pdfKey);
        const updated = await this.prisma.estimate.update({
            where: { id: estimate.id },
            data: {
                pdfUrl: pdfUrl,
                pdfKey: pdfKey,
                pdfStatus: 'generated',
                pdfGeneratedAt: new Date(),
            },
        });
        return { ...estimate, ...updated };
    }
    async sendWhatsApp(estimateId) {
        const estimate = await this.prisma.estimate.findUnique({
            where: { id: estimateId },
            include: { client: true, items: true, tenant: true },
        });
        if (!estimate)
            throw new common_1.NotFoundException('Orçamento não encontrado');
        if (!estimate.client?.phone)
            throw new common_1.NotFoundException('Cliente sem telefone');
        const updated = await this.ensurePdf(estimate);
        const msg = (0, estimate_message_util_1.buildEstimateMessage)(updated, updated.pdfUrl);
        const whatsappLink = this.whatsappService.generateWhatsAppLink(updated.client.phone, msg.text);
        this.logger.log(`📲 WhatsApp gerado para orçamento ${estimate.id}`);
        return { success: true, whatsappLink, message: msg.text };
    }
};
exports.EstimatesWhatsappService = EstimatesWhatsappService;
exports.EstimatesWhatsappService = EstimatesWhatsappService = EstimatesWhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        estimates_pdf_service_1.EstimatesPdfService,
        storage_service_1.StorageService,
        whatsapp_service_1.WhatsappService])
], EstimatesWhatsappService);
//# sourceMappingURL=estimates-whatsapp.service.js.map