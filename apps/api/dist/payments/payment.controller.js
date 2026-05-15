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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../auth/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const prisma_service_1 = require("../shared/prisma/prisma.service");
const crypto_1 = require("crypto");
const config_1 = require("@nestjs/config");
class CreateSubscriptionDto {
}
let PaymentController = class PaymentController {
    constructor(paymentService, prisma, configService) {
        this.paymentService = paymentService;
        this.prisma = prisma;
        this.configService = configService;
    }
    async createSubscription(body) {
        console.log('\n🔵 CRIANDO ASSINATURA REAL (trial 7 dias) 🔵');
        const { email, officeName, documentType, documentNumber, phone, cep, address, externalReference } = body;
        if (!email)
            throw new common_1.BadRequestException('Email é obrigatório');
        const finalExternalRef = externalReference || (0, crypto_1.randomUUID)();
        const frontendUrl = this.configService.get('FRONTEND_URL');
        const backUrl = `${frontendUrl}/register?payment=success`;
        const pending = await this.prisma.pendingSubscription.create({
            data: {
                email,
                planId: 'plano_mecpro_mensal',
                trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'pending',
                officeName: officeName || '',
                documentType: documentType || 'CPF',
                documentNumber: documentNumber || '',
                phone: phone || '',
                cep: cep || '',
                address: address || '',
            },
        });
        const { checkoutLink, preapprovalId } = await this.paymentService.createSubscription({
            email,
            externalReference: finalExternalRef,
            backUrl,
        });
        await this.prisma.pendingSubscription.update({
            where: { id: pending.id },
            data: { subscriptionId: preapprovalId },
        });
        console.log(`✅ Assinatura MP: ${preapprovalId}`);
        return {
            success: true,
            checkoutLink,
            preapprovalId,
            pendingId: pending.id,
        };
    }
    async getSubscriptionStatus(user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: {
                id: true,
                status: true,
                paymentStatus: true,
                trialEndsAt: true,
                subscriptionId: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        planName: true,
                        price: true,
                        status: true,
                        endDate: true,
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        const currentSubscription = tenant.subscriptions[0] || null;
        return {
            success: true,
            data: {
                tenantStatus: tenant.status,
                paymentStatus: tenant.paymentStatus,
                trialEndsAt: tenant.trialEndsAt,
                subscriptionId: tenant.subscriptionId,
                currentPlan: currentSubscription,
            },
        };
    }
    async cancelSubscription(user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { subscriptionId: true, id: true },
        });
        if (!tenant || !tenant.subscriptionId) {
            throw new common_1.BadRequestException('Nenhuma assinatura ativa encontrada');
        }
        const cancelled = await this.paymentService.cancelSubscription(tenant.subscriptionId);
        if (cancelled) {
            await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    status: 'CANCELED',
                    paymentStatus: 'CANCELED',
                },
            });
            await this.prisma.subscription.updateMany({
                where: {
                    tenantId: tenant.id,
                    status: 'ACTIVE',
                },
                data: {
                    status: 'CANCELED',
                },
            });
        }
        return {
            success: cancelled,
            message: cancelled
                ? 'Assinatura cancelada com sucesso'
                : 'Erro ao cancelar assinatura',
        };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('create-subscription'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSubscriptionDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('subscription-status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getSubscriptionStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('cancel-subscription'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "cancelSubscription", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map