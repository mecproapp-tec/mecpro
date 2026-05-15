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
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const invoices_service_1 = require("./invoices.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const update_invoice_dto_1 = require("./dto/update-invoice.dto");
let InvoicesController = class InvoicesController {
    constructor(invoicesService) {
        this.invoicesService = invoicesService;
    }
    async findAll(user, page = '1', limit = '50') {
        if (!user)
            throw new common_1.UnauthorizedException('Usuário não autenticado');
        if (!user.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.findAll(user.tenantId, parseInt(page), parseInt(limit));
    }
    async findOne(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.findOne(Number(id), user.tenantId);
    }
    async getShareLink(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.generateShareLink(Number(id), user.tenantId);
    }
    async createShareLink(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.generateShareLink(Number(id), user.tenantId);
    }
    async create(createDto, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.create(user.tenantId, createDto);
    }
    async update(id, updateDto, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.update(Number(id), user.tenantId, updateDto);
    }
    async updatePartial(id, updateDto, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.update(Number(id), user.tenantId, updateDto);
    }
    async remove(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        await this.invoicesService.remove(Number(id), user.tenantId);
    }
    async sendToWhatsApp(id, phoneNumber, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        let finalPhone = phoneNumber;
        if (!finalPhone || finalPhone.trim() === '') {
            const invoice = await this.invoicesService.findOne(Number(id), user.tenantId);
            finalPhone = invoice.client?.phone;
            if (!finalPhone) {
                throw new common_1.BadRequestException('Cliente sem telefone cadastrado');
            }
        }
        return this.invoicesService.sendToWhatsApp(Number(id), user.tenantId, finalPhone);
    }
    async resendPdf(id, user) {
        if (!user?.tenantId)
            throw new common_1.BadRequestException('TenantId não encontrado');
        return this.invoicesService.resendPdf(Number(id), user.tenantId);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "getShareLink", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "createShareLink", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_invoice_dto_1.UpdateInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_invoice_dto_1.UpdateInvoiceDto, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "updatePartial", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/send-whatsapp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('phoneNumber')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "sendToWhatsApp", null);
__decorate([
    (0, common_1.Post)(':id/resend-pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "resendPdf", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('invoices'),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map