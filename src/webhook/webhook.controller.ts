import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from '../payments/payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EmailService } from '../shared/email/email.service';
import { randomUUID } from 'crypto';
import { Public } from '../auth/public.decorator';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Public()
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadopagoWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    console.log('\n🔔 WEBHOOK RECEBIDO:', JSON.stringify(body, null, 2));

    const { type, data } = body;

    // Segurança mínima: sempre responder 200
    if (!data?.id) {
      return { received: true };
    }

    try {
      // ================= 🔥 ASSINATURA / SUBSCRIPTION =================
      if (type === 'preapproval') {
        const mpSubscription = await this.paymentService.getSubscription(data.id);

        if (!mpSubscription) {
          this.logger.warn(`Assinatura não encontrada: ${data.id}`);
          return { received: true };
        }

        // ================= 🔁 IDEMPOTÊNCIA =================
        const alreadyProcessed = await this.prisma.subscription.findFirst({
          where: { gatewaySubscriptionId: mpSubscription.id },
        });

        if (alreadyProcessed) {
          console.log('⏭️ Assinatura já processada');
          return { received: true };
        }

        // ================= 🔍 BUSCAR PENDING =================
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

        // ================= 🏢 TENANT =================
        let tenant = await this.prisma.tenant.findFirst({
          where: { email: pendingSub.email },
        });

        if (!tenant) {
          const registrationToken = randomUUID();

          tenant = await this.prisma.tenant.create({
            data: {
              id: randomUUID(),
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
              registrationTokenExpiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ),
            },
          });

          console.log('✅ Tenant criado:', tenant.id);

          await this.emailService.sendRegistrationEmail(
            pendingSub.email,
            registrationToken,
            pendingSub.officeName || 'Sua Oficina',
          );

          console.log('📧 Email enviado para:', pendingSub.email);
        }

        // ================= 📊 STATUS =================
        let tenantStatus: any = 'BLOCKED';
        let subscriptionStatus: any = 'PAST_DUE';

        if (mpSubscription.status === 'authorized') {
          tenantStatus = 'ACTIVE';
          subscriptionStatus = 'ACTIVE';
        } else if (mpSubscription.status === 'cancelled') {
          tenantStatus = 'CANCELED';
          subscriptionStatus = 'CANCELED';
        }

        // ================= 🧾 UPDATE TENANT =================
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

        // ================= 💳 CRIAR SUBSCRIPTION =================
        await this.prisma.subscription.create({
          data: {
            id: randomUUID(),
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

        // ================= ✅ FINALIZAR PENDING =================
        await this.prisma.pendingSubscription.update({
          where: { id: pendingSub.id },
          data: {
            subscriptionId: mpSubscription.id,
            status: 'PAID',
          },
        });

        console.log('✅ Webhook processado com sucesso');
      }

      // ================= 💰 FUTURO: PAYMENT =================
      if (type === 'payment') {
        console.log('💰 Evento de pagamento recebido:', data.id);
        // aqui depois você pode tratar cobrança mensal
      }

    } catch (error: any) {
      this.logger.error(`Erro no webhook: ${error.message}`);
      console.error(error);
    }

    return { received: true };
  }
}