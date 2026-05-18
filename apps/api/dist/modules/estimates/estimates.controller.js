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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimatesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const estimates_service_1 = require("./estimates.service");
const estimates_pdf_service_1 = require("./estimates-pdf.service");
const create_estimate_dto_1 = require("./dto/create-estimate.dto");
const update_estimate_dto_1 = require("./dto/update-estimate.dto");
let EstimatesController = class EstimatesController {
    constructor(estimatesService, pdfService) {
        this.estimatesService = estimatesService;
        this.pdfService = pdfService;
    }
    async findAll(user, page = '1', limit = '50') {
        if (!user)
            throw new common_1.UnauthorizedException('Usuário não autenticado');
        if (!user.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.findAll(user.tenantId, parseInt(page), parseInt(limit));
    }
    async findConverted(user, page = '1', limit = '50') {
        if (!user)
            throw new common_1.UnauthorizedException('Usuário não autenticado');
        if (!user.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.findConverted(user.tenantId, parseInt(page), parseInt(limit));
    }
    async findOne(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.findOne(Number(id), user.tenantId);
    }
    async downloadPdf(id, user, res) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        const estimate = await this.estimatesService.findOne(Number(id), user.tenantId);
        if (!estimate)
            throw new common_1.BadRequestException('Orçamento não encontrado');
        const pdfBuffer = await this.pdfService.generateEstimatePdf(estimate);
        const filename = `orcamento-${estimate.id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.send(pdfBuffer);
    }
    async getShareLink(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.generateShareLink(Number(id), user.tenantId);
    }
    async create(createDto, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.create(user.tenantId, createDto);
    }
    async update(id, updateDto, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.update(Number(id), user.tenantId, updateDto);
    }
    async convertToInvoice(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        const result = await this.estimatesService.convertToInvoice(Number(id), user.tenantId);
        return {
            message: 'Orçamento convertido em fatura com sucesso',
            invoiceId: result.invoiceId,
            invoiceNumber: result.invoiceNumber,
            invoice: result.invoice
        };
    }
    async remove(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        await this.estimatesService.remove(Number(id), user.tenantId);
    }
    async sendToWhatsApp(id, phoneNumber, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        let finalPhone = phoneNumber;
        if (!finalPhone) {
            const estimate = await this.estimatesService.findOne(Number(id), user.tenantId);
            finalPhone = estimate.client?.phone;
            if (!finalPhone)
                throw new common_1.BadRequestException('Cliente sem telefone cadastrado');
        }
        return this.estimatesService.sendToWhatsApp(Number(id), user.tenantId, finalPhone);
    }
    async resendPdf(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.estimatesService.resendPdf(Number(id), user.tenantId);
    }
};
exports.EstimatesController = EstimatesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('converted'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "findConverted", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)(':id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "getShareLink", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_estimate_dto_1.CreateEstimateDto, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_estimate_dto_1.UpdateEstimateDto, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "convertToInvoice", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/send-whatsapp'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('phoneNumber')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "sendToWhatsApp", null);
__decorate([
    (0, common_1.Post)(':id/resend-pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EstimatesController.prototype, "resendPdf", null);
exports.EstimatesController = EstimatesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('estimates'),
    __metadata("design:paramtypes", [estimates_service_1.EstimatesService,
        estimates_pdf_service_1.EstimatesPdfService])
], EstimatesController);
//# sourceMappingURL=estimates.controller.js.map