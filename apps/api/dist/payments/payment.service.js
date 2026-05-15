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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mercadopago_1 = require("mercadopago");
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PaymentService_1.name);
    }
    onModuleInit() {
        const accessToken = this.configService.get('MERCADO_PAGO_ACCESS_TOKEN');
        if (!accessToken) {
            this.logger.error('❌ Mercado Pago Access Token não configurado');
            throw new Error('Mercado Pago Access Token não configurado');
        }
        this.client = new mercadopago_1.MercadoPagoConfig({ accessToken });
        this.preApproval = new mercadopago_1.PreApproval(this.client);
        this.logger.log('✅ Mercado Pago inicializado com sucesso');
    }
    async createSubscription(params) {
        try {
            this.logger.log(`🔵 Criando assinatura REAL para ${params.email}`);
            if (!params.email) {
                throw new common_1.BadRequestException('Email é obrigatório');
            }
            console.log('📦 PARAMS RECEBIDOS:', JSON.stringify(params, null, 2));
            const response = await this.preApproval.create({
                body: {
                    reason: 'Plano MecPro - Oficina Mecânica',
                    external_reference: params.externalReference,
                    payer_email: params.email,
                    back_url: params.backUrl,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: 'months',
                        transaction_amount: 149.9,
                        currency_id: 'BRL',
                    },
                    status: 'pending',
                },
            });
            console.log('🔥 RESPOSTA COMPLETA MP:', JSON.stringify(response, null, 2));
            const preapprovalId = response.id;
            const checkoutLink = response.init_point;
            if (!checkoutLink) {
                this.logger.error('❌ Mercado Pago não retornou checkoutLink');
                console.log('🔥 RESPONSE MP:', response);
                throw new common_1.BadRequestException('Mercado Pago não retornou checkoutLink');
            }
            this.logger.log(`✅ Assinatura criada com sucesso: ${preapprovalId}`);
            this.logger.log(`🔗 Checkout Link: ${checkoutLink}`);
            return { checkoutLink, preapprovalId };
        }
        catch (error) {
            this.logger.error(`❌ Erro ao criar assinatura Mercado Pago`, error);
            console.log('🔥 ERRO COMPLETO MP:', JSON.stringify(error, null, 2));
            throw new common_1.BadRequestException(error?.message || 'Falha ao criar assinatura no Mercado Pago');
        }
    }
    async getSubscription(preapprovalId) {
        try {
            this.logger.log(`🔎 Consultando assinatura: ${preapprovalId}`);
            const response = await this.preApproval.get({ id: preapprovalId });
            console.log('📄 RESPOSTA CONSULTA MP:', JSON.stringify(response, null, 2));
            return response;
        }
        catch (error) {
            this.logger.error(`❌ Erro ao consultar assinatura ${preapprovalId}`, error);
            console.log('🔥 ERRO CONSULTA MP:', JSON.stringify(error, null, 2));
            throw new common_1.BadRequestException('Assinatura não encontrada');
        }
    }
    async cancelSubscription(preapprovalId) {
        try {
            this.logger.log(`🛑 Cancelando assinatura: ${preapprovalId}`);
            await this.preApproval.update({
                id: preapprovalId,
                body: { status: 'cancelled' },
            });
            this.logger.log(`✅ Assinatura cancelada: ${preapprovalId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`❌ Erro ao cancelar assinatura`, error);
            console.log('🔥 ERRO CANCELAMENTO MP:', JSON.stringify(error, null, 2));
            return false;
        }
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map