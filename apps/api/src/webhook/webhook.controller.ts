// src/webhook/webhook.controller.ts
import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { PaymentService } from '../payments/payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as crypto from 'crypto';

@Controller('webhook')
export class WebhookController {
  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
  ) {}

  @Post('mercadopago')
  async mercadopagoWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
  ) {
    // Validação da assinatura (se configurada)
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
      if (signature !== expectedSignature) {
        console.warn('Assinatura inválida, ignorando webhook');
        throw new BadRequestException('Assinatura inválida');
      }
    }

    console.log('📩 Webhook recebido:', JSON.stringify(body, null, 2));

    const { type, data } = body;

    // ========== ASSINATURA RECORRENTE ==========
    if (type === 'preapproval') {
      try {
        // Busca a assinatura no Mercado Pago
        const mpSubscription = await this.paymentService.getSubscription(data.id);

        // 1. Localiza o pendingSubscription
        let pendingSub = null;
        if (mpSubscription.external_reference) {
          pendingSub = await this.prisma.pendingSubscription.findUnique({
            where: { id: mpSubscription.external_reference },
          });
        }
        if (!pendingSub && mpSubscription.payer_email) {
          pendingSub = await this.prisma.pendingSubscription.findFirst({
            where: { email: mpSubscription.payer_email, status: 'pending' },
          });
        }

        if (!pendingSub) {
          console.warn('⚠️ Nenhum pendingSubscription encontrado para assinatura:', mpSubscription.id);
          return { received: true };
        }

        // 2. Localiza o tenant
        let tenant = null;
        if (pendingSub.tenantId) {
          tenant = await this.prisma.tenant.findUnique({
            where: { id: pendingSub.tenantId },
          });
        }
        if (!tenant && pendingSub.email) {
          tenant = await this.prisma.tenant.findFirst({
            where: { email: pendingSub.email },
          });
        }

        if (!tenant) {
          console.warn('⚠️ Tenant não encontrado para pendingSubscription:', pendingSub.id);
          return { received: true };
        }

        // 3. Mapeia status do Mercado Pago para os campos internos
        let tenantStatus: 'ACTIVE' | 'BLOCKED' | 'CANCELED' = 'BLOCKED';
        let paymentStatus = 'expired';
        let subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' = 'CANCELED';

        switch (mpSubscription.status) {
          case 'authorized':
            tenantStatus = 'ACTIVE';
            paymentStatus = 'paid';
            subscriptionStatus = 'ACTIVE';
            break;
          case 'paused':
            tenantStatus = 'BLOCKED';
            paymentStatus = 'overdue';
            subscriptionStatus = 'PAST_DUE';
            break;
          case 'cancelled':
            tenantStatus = 'CANCELED';
            paymentStatus = 'canceled';
            subscriptionStatus = 'CANCELED';
            break;
          default:
            // outros: pending, in_process, etc.
            tenantStatus = 'BLOCKED';
            paymentStatus = 'pending';
            subscriptionStatus = 'PAST_DUE';
        }

        // 4. Atualiza o tenant
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionId: mpSubscription.id,
            status: tenantStatus,
            paymentStatus,
            trialEndsAt: mpSubscription.next_payment_date
              ? new Date(mpSubscription.next_payment_date)
              : null,
          },
        });

        // 5. Cria ou atualiza o registro em Subscription
        const existingSub = await this.prisma.subscription.findFirst({
          where: { tenantId: tenant.id },
        });

        const subscriptionData = {
          gatewaySubscriptionId: mpSubscription.id,
          status: subscriptionStatus,
          endDate: mpSubscription.next_payment_date
            ? new Date(mpSubscription.next_payment_date)
            : null,
        };

        if (existingSub) {
          await this.prisma.subscription.update({
            where: { id: existingSub.id },
            data: subscriptionData,
          });
        } else {
          await this.prisma.subscription.create({
            data: {
              tenantId: tenant.id,
              planName: mpSubscription.preapproval_plan_id || 'PLANO_BASICO',
              price: 0, // se tiver preço, ajuste conforme seu plano
              status: subscriptionStatus,
              gateway: 'MERCADOPAGO',
              gatewaySubscriptionId: mpSubscription.id,
              startDate: new Date(),
              endDate: mpSubscription.next_payment_date
                ? new Date(mpSubscription.next_payment_date)
                : null,
            },
          });
        }

        // 6. Atualiza a pendingSubscription para pago
        await this.prisma.pendingSubscription.update({
          where: { id: pendingSub.id },
          data: {
            subscriptionId: mpSubscription.id,
            planId: mpSubscription.preapproval_plan_id,
            status: 'paid',
          },
        });

        console.log(`💰 Tenant ${tenant.id} atualizado: status=${tenantStatus}, payment=${paymentStatus}`);
      } catch (error) {
        console.error('Erro ao processar webhook de assinatura:', error);
      }
    }

    // ========== PAGAMENTO ÚNICO (opcional) ==========
    if (type === 'payment') {
      try {
        const payment = await this.paymentService.getPayment(data.id);
        if (payment.status === 'approved' && payment.payer?.email) {
          console.log(`✅ Pagamento aprovado para ${payment.payer.email}`);
          // Opcional: registrar no model Payment
          // Você pode usar external_reference para saber qual tenant
        }
      } catch (error) {
        console.error('Erro ao processar webhook de pagamento:', error);
      }
    }

    return { received: true };
  }
}