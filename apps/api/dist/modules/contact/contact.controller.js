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
exports.ContactController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../../auth/public.decorator");
const contact_service_1 = require("./contact.service");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
let ContactController = class ContactController {
    constructor(contactService) {
        this.contactService = contactService;
    }
    async sendContact(data) {
        if (!data.message || data.message.trim().length === 0) {
            throw new common_1.BadRequestException('Mensagem é obrigatória');
        }
        if (!data.userEmail && !data.userName) {
            throw new common_1.BadRequestException('Email ou nome do usuário é obrigatório');
        }
        if (data.message.length > 5000) {
            throw new common_1.BadRequestException('Mensagem muito longa. Limite de 5000 caracteres.');
        }
        const saved = await this.contactService.create({
            userEmail: data.userEmail,
            userName: data.userName,
            message: data.message,
            tenantId: data.tenantId,
        });
        return {
            success: true,
            message: 'Mensagem enviada com sucesso',
            id: saved.id,
            receivedAt: saved.createdAt,
        };
    }
    async getContacts(user) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.UnauthorizedException('Acesso restrito a administradores');
        }
        return this.contactService.findAll();
    }
    async replyToContact(id, body, user) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.UnauthorizedException();
        }
        if (!body.reply || body.reply.trim().length === 0) {
            throw new common_1.BadRequestException('Resposta não pode ser vazia');
        }
        return this.contactService.reply(Number(id), body.reply);
    }
    async deleteContact(id, user) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new common_1.UnauthorizedException();
        }
        await this.contactService.remove(Number(id));
        return { success: true, message: 'Mensagem excluída' };
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "sendContact", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "getContacts", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id/reply'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "replyToContact", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContactController.prototype, "deleteContact", null);
exports.ContactController = ContactController = __decorate([
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [contact_service_1.ContactService])
], ContactController);
//# sourceMappingURL=contact.controller.js.map