import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
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
    this.logger.log(`Webhook received type: ${body.type}`);

    if (!this.validateSignature(body, headers)) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const { type, data } = body;
    if (!data?.id) {
      this.logger.warn('Webhook without data.id');
      return { received: true };
    }

    try {
      if (type === 'preapproval' || type === 'subscription_preapproval') {
        await this.handlePreapproval(data.id);
      } else if (type === 'payment') {
        await this.handlePayment(data.id);
      } else {
        this.logger.log(`Ignored event type: ${type}`);
      }
    } catch (error: any) {
      this.logger.error(`Webhook processing error: ${error.message}`);
    }

    return { received: true };
  }

  private async handlePreapproval(preapprovalId: string) {
    this.logger.log(`Processing preapproval: ${preapprovalId}`);

    const mpSubscription = await this.paymentService.getSubscription(preapprovalId);
    if (!mpSubscription) {
      this.logger.warn(`Subscription not found in MP: ${preapprovalId}`);
      return;
    }

    if (mpSubscription.status !== 'authorized') {
      this.logger.log(`Subscription not authorized yet: ${mpSubscription.status}`);
      return;
    }

    const alreadyProcessed = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId: mpSubscription.id },
    });
    if (alreadyProcessed) {
      this.logger.log(`Subscription already processed: ${mpSubscription.id}`);
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
      this.logger.warn(`PendingSubscription not found for ${preapprovalId}`);
      return;
    }

    const existingTenant = await this.prisma.tenant.findFirst({
      where: { email: pendingSub.email },
    });
    if (existingTenant) {
      this.logger.log(`Tenant already exists for email ${pendingSub.email}`);
      return;
    }

    const registrationToken = randomUUID();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLink = `${frontendUrl}/complete-registration?token=${registrationToken}`;
    const emailText = `Olá ${pendingSub.officeName || 'Oficina'},\n\nClique no link abaixo para definir sua senha e ativar sua conta:\n${magicLink}\n\nLink válido por 7 dias.\n\nEquipe MecPro`;

    await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          id: randomUUID(),
          name: pendingSub.officeName || 'Oficina',
          email: pendingSub.email,
          documentType: pendingSub.documentType || 'CPF',
          documentNumber: pendingSub.documentNumber || '',
          cep: pendingSub.cep || '',
          address: pendingSub.address || '',
          phone: pendingSub.phone || '',
          status: 'ACTIVE',
          subscriptionId: mpSubscription.id,
          registrationToken,
          registrationTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.user.create({
        data: {
          name: pendingSub.officeName || 'Oficina',
          email: pendingSub.email,
          password: '',
          role: 'OWNER',
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
      });

      await tx.subscription.create({
        data: {
          id: randomUUID(),
          tenantId: tenant.id,
          planName: 'PLANO_MECPRO',
          price: 149.9,
          status: 'ACTIVE',
          gateway: 'MERCADOPAGO',
          gatewaySubscriptionId: mpSubscription.id,
          startDate: new Date(),
          endDate: mpSubscription.next_payment_date
            ? new Date(mpSubscription.next_payment_date)
            : null,
        },
      });

      await tx.pendingSubscription.update({
        where: { id: pendingSub.id },
        data: {
          subscriptionId: mpSubscription.id,
          status: 'PAID',
        },
      });

      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          trialEndsAt: mpSubscription.next_payment_date
            ? new Date(mpSubscription.next_payment_date)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    });

    await this.mailService.sendEmail(pendingSub.email, 'Complete seu cadastro - MecPro', emailText);
    this.logger.log(`Preapproval ${preapprovalId} processed successfully, email sent to ${pendingSub.email}`);
  }

  private async handlePayment(paymentId: string) {
    this.logger.log(`Processing payment: ${paymentId}`);

    const paymentDetails = await this.paymentService.getPayment(paymentId);
    if (!paymentDetails) {
      this.logger.warn(`Payment not found: ${paymentId}`);
      return;
    }

    if (paymentDetails.type === 'subscription_payment' && paymentDetails.subscription_id) {
      const subscriptionId = paymentDetails.subscription_id;
      const subscription = await this.prisma.subscription.findFirst({
        where: { gatewaySubscriptionId: subscriptionId },
        include: { tenant: true },
      });

      if (!subscription) {
        this.logger.warn(`Local subscription not found: ${subscriptionId}`);
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        if (paymentDetails.status === 'approved') {
          await tx.tenant.update({
            where: { id: subscription.tenantId },
            data: {
              status: 'ACTIVE',
              trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          this.logger.log(`Subscription ${subscriptionId} renewed with payment ${paymentId}`);
        } else {
          await tx.tenant.update({
            where: { id: subscription.tenantId },
            data: { status: 'BLOCKED' },
          });
          this.logger.warn(`Payment ${paymentId} not approved. Tenant blocked.`);
        }
      });
    } else {
      this.logger.log(`One-time payment received (not subscription): ${paymentId}`);
    }
  }

  private validateSignature(body: any, headers: any): boolean {
    const signature = headers['x-signature'];
    if (!signature) {
      this.logger.warn('Missing x-signature header');
      return false;
    }

    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('MP_WEBHOOK_SECRET not configured');
      return false;
    }

    const parts = signature.split(',');
    const tsPart = parts.find(p => p.startsWith('ts='));
    const hashPart = parts.find(p => p.startsWith('v1='));
    if (!tsPart || !hashPart) {
      return false;
    }

    const ts = tsPart.split('=')[1];
    const receivedHash = hashPart.split('=')[1];
    const manifest = `id:${body.id};` + (body.type ? `type:${body.type};` : '') + `date:${body.date};`;
    const hmac = createHmac('sha256', secret);
    hmac.update(`${ts}:${manifest}`);
    const expectedHash = hmac.digest('hex');

    try {
      return timingSafeEqual(Buffer.from(receivedHash), Buffer.from(expectedHash));
    } catch {
      return false;
    }
  }
}