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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../payments/payment.service");
const prisma_service_1 = require("../shared/prisma/prisma.service");
const email_service_1 = require("../shared/email/email.service");
const crypto_1 = require("crypto");
const public_decorator_1 = require("../auth/public.decorator");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(paymentService, prisma, emailService) {
        this.paymentService = paymentService;
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async mercadopagoWebhook(body, headers) {
        console.log('\n🔔 WEBHOOK RECEBIDO:', JSON.stringify(body, null, 2));
        const { type, data } = body;
        if (!data?.id) {
            return { received: true };
        }
        try {
            if (type === 'preapproval') {
                const mpSubscription = await this.paymentService.getSubscription(data.id);
                if (!mpSubscription) {
                    this.logger.warn(`Assinatura não encontrada: ${data.id}`);
                    return { received: true };
                }
                const alreadyProcessed = await this.prisma.subscription.findFirst({
                    where: { gatewaySubscriptionId: mpSubscription.id },
                });
                if (alreadyProcessed) {
                    console.log('⏭️ Assinatura já processada');
                    return { received: true };
                }
                let pendingSub = null;
                if (mpSubscription.external_reference) {
                    pendingSub = await this.prisma.pendingSubscription.findUnique({
                        where: { id: mpSubscription.external_reference },
                    });
                }
                if (!pendingSub && mpSubscription.payer_email) {
                    pendingSub = await this.prisma.pendingSubscription.findFirst({
                        where: {
                            email: mpSubscription.payer_email,
                            status: 'PENDING',
                        },
                    });
                }
                if (!pendingSub) {
                    this.logger.warn(`Pending não encontrado`);
                    return { received: true };
                }
                let tenant = await this.prisma.tenant.findFirst({
                    where: { email: pendingSub.email },
                });
                if (!tenant) {
                    const registrationToken = (0, crypto_1.randomUUID)();
                    tenant = await this.prisma.tenant.create({
                        data: {
                            id: (0, crypto_1.randomUUID)(),
                            name: pendingSub.officeName || 'Oficina',
                            email: pendingSub.email,
                            documentType: pendingSub.documentType || 'CPF',
                            documentNumber: pendingSub.documentNumber || '',
                            cep: pendingSub.cep || '',
                            address: pendingSub.address || '',
                            phone: pendingSub.phone || '',
                            status: 'BLOCKED',
                            subscriptionId: mpSubscription.id,
                            registrationToken,
                            registrationTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        },
                    });
                    console.log('✅ Tenant criado:', tenant.id);
                    await this.emailService.sendRegistrationEmail(pendingSub.email, registrationToken, pendingSub.officeName || 'Sua Oficina');
                    console.log('📧 Email enviado para:', pendingSub.email);
                }
                let tenantStatus = 'BLOCKED';
                let subscriptionStatus = 'PAST_DUE';
                if (mpSubscription.status === 'authorized') {
                    tenantStatus = 'ACTIVE';
                    subscriptionStatus = 'ACTIVE';
                }
                else if (mpSubscription.status === 'cancelled') {
                    tenantStatus = 'CANCELED';
                    subscriptionStatus = 'CANCELED';
                }
                await this.prisma.tenant.update({
                    where: { id: tenant.id },
                    data: {
                        subscriptionId: mpSubscription.id,
                        status: tenantStatus,
                        trialEndsAt: mpSubscription.next_payment_date
                            ? new Date(mpSubscription.next_payment_date)
                            : pendingSub.trialEndsAt,
                    },
                });
                await this.prisma.subscription.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
                        tenantId: tenant.id,
                        planName: 'PLANO_MECPRO',
                        price: 149.9,
                        status: subscriptionStatus,
                        gateway: 'MERCADOPAGO',
                        gatewaySubscriptionId: mpSubscription.id,
                        startDate: new Date(),
                        endDate: mpSubscription.next_payment_date
                            ? new Date(mpSubscription.next_payment_date)
                            : null,
                    },
                });
                await this.prisma.pendingSubscription.update({
                    where: { id: pendingSub.id },
                    data: {
                        subscriptionId: mpSubscription.id,
                        status: 'PAID',
                    },
                });
                console.log('✅ Webhook processado com sucesso');
            }
            if (type === 'payment') {
                console.log('💰 Evento de pagamento recebido:', data.id);
            }
        }
        catch (error) {
            this.logger.error(`Erro no webhook: ${error.message}`);
            console.error(error);
        }
        return { received: true };
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('mercadopago'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "mercadopagoWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        prisma_service_1.PrismaService,
        email_service_1.EmailService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map