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
import { MailService } from '../modules/mail/mail.service';
import { randomUUID } from 'crypto';
import { Public } from '../auth/public.decorator';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @Public()
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadopagoWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    this.logger.log(`🔔 Webhook recebido: ${JSON.stringify(body)}`);

    const { type, data } = body;

    if (!data?.id) {
      this.logger.warn('Webhook sem data.id');
      return { received: true };
    }

    try {
      if (type === 'preapproval') {
        await this.handlePreapproval(data.id);
      }
      else if (type === 'payment') {
        await this.handlePayment(data.id);
      }
      else {
        this.logger.log(`Tipo de evento ignorado: ${type}`);
      }
    } catch (error: any) {
      this.logger.error(`Erro no webhook: ${error.message}`);
    }

    return { received: true };
  }

  private async handlePreapproval(preapprovalId: string) {
    this.logger.log(`📌 Processando preapproval: ${preapprovalId}`);

    const mpSubscription = await this.paymentService.getSubscription(preapprovalId);
    if (!mpSubscription) {
      this.logger.warn(`Assinatura não encontrada no MP: ${preapprovalId}`);
      return;
    }

    const alreadyProcessed = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId: mpSubscription.id },
    });
    if (alreadyProcessed) {
      this.logger.log(`⏭️ Assinatura já processada: ${mpSubscription.id}`);
      return;
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
      this.logger.warn(`PendingSubscription não encontrado para assinatura ${preapprovalId}`);
      return;
    }

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
          registrationTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      this.logger.log(`✅ Tenant criado: ${tenant.id}`);

      // Cria o usuário (sem senha ainda)
      await this.prisma.user.create({
        data: {
          name: pendingSub.officeName || 'Oficina',
          email: pendingSub.email,
          password: '',
          role: 'OWNER',
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
      });

      // Envia e-mail com link mágico
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const magicLink = `${frontendUrl}/complete-registration?token=${registrationToken}`;
      const emailText = `Olá ${pendingSub.officeName || 'Oficina'},\n\nClique no link abaixo para definir sua senha e ativar sua conta:\n${magicLink}\n\nLink válido por 7 dias.\n\nEquipe MecPro`;
      await this.mailService.sendEmail(
        pendingSub.email,
        'Complete seu cadastro - MecPro',
        emailText,
      );
      this.logger.log(`📧 E-mail mágico enviado para ${pendingSub.email}`);
    }

    let tenantStatus: 'ACTIVE' | 'BLOCKED' | 'CANCELED' = 'BLOCKED';
    let subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' = 'PAST_DUE';

    if (mpSubscription.status === 'authorized') {
      tenantStatus = 'ACTIVE';
      subscriptionStatus = 'ACTIVE';
    } else if (mpSubscription.status === 'cancelled') {
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

    await this.prisma.pendingSubscription.update({
      where: { id: pendingSub.id },
      data: {
        subscriptionId: mpSubscription.id,
        status: 'PAID',
      },
    });

    this.logger.log(`✅ Assinatura ${preapprovalId} processada com sucesso`);
  }

  private async handlePayment(paymentId: string) {
    this.logger.log(`💰 Processando pagamento: ${paymentId}`);

    const paymentDetails = await this.paymentService.getPayment(paymentId);
    if (!paymentDetails) {
      this.logger.warn(`Pagamento não encontrado: ${paymentId}`);
      return;
    }

    if (paymentDetails.type === 'subscription_payment' && paymentDetails.subscription_id) {
      const subscriptionId = paymentDetails.subscription_id;
      const subscription = await this.prisma.subscription.findFirst({
        where: { gatewaySubscriptionId: subscriptionId },
        include: { tenant: true },
      });

      if (!subscription) {
        this.logger.warn(`Assinatura local não encontrada: ${subscriptionId}`);
        return;
      }

      if (paymentDetails.status === 'approved') {
        await this.prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: {
            status: 'ACTIVE',
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        this.logger.log(`✅ Assinatura ${subscriptionId} renovada com pagamento ${paymentId}`);
      } else {
        await this.prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: { status: 'BLOCKED' },
        });
        this.logger.warn(`❌ Pagamento ${paymentId} não aprovado. Tenant bloqueado.`);
      }
    } else {
      this.logger.log(`Pagamento avulso recebido (não assinatura): ${paymentId}`);
    }
  }
}