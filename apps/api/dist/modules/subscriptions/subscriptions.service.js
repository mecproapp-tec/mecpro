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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const payment_service_1 = require("../../payments/payment.service");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma, paymentService, configService) {
        this.prisma = prisma;
        this.paymentService = paymentService;
        this.configService = configService;
    }
    async getByTenantId(tenantId) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { tenantId },
            select: {
                id: true,
                planName: true,
                price: true,
                status: true,
                gateway: true,
                gatewaySubscriptionId: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                payments: { select: { id: true, amount: true, status: true, gatewayPaymentId: true, paidAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
            },
        });
        return subscription || null;
    }
    async getById(id) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            select: {
                id: true,
                planName: true,
                price: true,
                status: true,
                gateway: true,
                gatewaySubscriptionId: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                payments: { select: { id: true, amount: true, status: true, gatewayPaymentId: true, paidAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } },
                tenant: { select: { id: true, name: true, email: true, phone: true, status: true } },
            },
        });
        if (!subscription)
            throw new common_1.NotFoundException('Assinatura não encontrada');
        return subscription;
    }
    async createSubscription(data) {
        return this.prisma.subscription.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                tenantId: data.tenantId,
                planName: data.planName,
                price: data.price,
                status: 'ACTIVE',
                gateway: data.gateway,
                gatewaySubscriptionId: data.gatewaySubscriptionId,
                startDate: data.startDate,
                endDate: data.endDate,
            },
            select: {
                id: true,
                planName: true,
                price: true,
                status: true,
                gateway: true,
                gatewaySubscriptionId: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                tenant: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async getSubscriptionStatus(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant não encontrado');
        const currentSubscription = tenant.subscriptions[0] || null;
        return {
            status: tenant.status,
            paymentStatus: tenant.paymentStatus,
            trialEndsAt: tenant.trialEndsAt,
            subscriptionId: tenant.subscriptionId,
            hasActiveSubscription: !!currentSubscription,
            plan: currentSubscription ? {
                name: currentSubscription.planName,
                price: currentSubscription.price,
                endDate: currentSubscription.endDate,
            } : null,
        };
    }
    async createCheckout(tenantId, email) {
        let pending = await this.prisma.pendingSubscription.findFirst({
            where: { tenantId, status: 'PENDING' },
        });
        if (!pending) {
            pending = await this.prisma.pendingSubscription.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    email,
                    tenantId,
                    planId: process.env.MP_PLAN_ID || 'PLANO_BASICO',
                    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    status: 'PENDING',
                },
            });
        }
        try {
            const frontendUrl = this.configService.get('FRONTEND_URL');
            const backUrl = `${frontendUrl}/register?payment=success`;
            const { checkoutLink } = await this.paymentService.createSubscription({
                email,
                externalReference: pending.id,
                backUrl,
            });
            return { checkoutLink, pendingId: pending.id };
        }
        catch (error) {
            console.error('Erro ao criar link de assinatura:', error);
            throw new common_1.BadRequestException('Erro ao gerar link de pagamento. Tente novamente.');
        }
    }
    async cancelSubscription(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { subscriptionId: true, id: true },
        });
        if (!tenant || !tenant.subscriptionId) {
            throw new common_1.BadRequestException('Nenhuma assinatura ativa encontrada');
        }
        const cancelled = await this.paymentService.cancelSubscription(tenant.subscriptionId);
        if (cancelled) {
            await this.prisma.tenant.update({
                where: { id: tenant.id },
                data: { status: 'CANCELED', paymentStatus: 'CANCELED' },
            });
            await this.prisma.subscription.updateMany({
                where: { tenantId: tenant.id, status: 'ACTIVE' },
                data: { status: 'CANCELED' },
            });
        }
        return { success: cancelled, message: cancelled ? 'Assinatura cancelada com sucesso' : 'Erro ao cancelar assinatura' };
    }
    async findAllSubscriptions(page = 1, limit = 50) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const skip = (safePage - 1) * safeLimit;
        const [data, total] = await this.prisma.$transaction([
            this.prisma.subscription.findMany({
                skip,
                take: safeLimit,
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            status: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.subscription.count(),
        ]);
        return {
            data,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payment_service_1.PaymentService,
        config_1.ConfigService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map