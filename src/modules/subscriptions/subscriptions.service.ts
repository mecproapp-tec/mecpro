// apps/api/src/modules/subscriptions/subscriptions.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PaymentService } from '../../payments/payment.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private configService: ConfigService,
  ) {}

  async getByTenantId(tenantId: string) {
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

  async getById(id: string) {
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
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');
    return subscription;
  }

  async createSubscription(data: {
    tenantId: string;
    planName: string;
    price: number;
    gateway: string;
    gatewaySubscriptionId: string;
    startDate: Date;
    endDate?: Date;
  }) {
    return this.prisma.subscription.create({
      data: {
        id: randomUUID(),
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

  async getSubscriptionStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');

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

  async createCheckout(tenantId: string, email: string) {
    let pending = await this.prisma.pendingSubscription.findFirst({
      where: { tenantId, status: 'PENDING' },
    });

    if (!pending) {
      pending = await this.prisma.pendingSubscription.create({
        data: {
          id: randomUUID(),
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
    } catch (error) {
      console.error('Erro ao criar link de assinatura:', error);
      throw new BadRequestException('Erro ao gerar link de pagamento. Tente novamente.');
    }
  }

  async cancelSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionId: true, id: true },
    });

    if (!tenant || !tenant.subscriptionId) {
      throw new BadRequestException('Nenhuma assinatura ativa encontrada');
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

  async findAllSubscriptions(page: number = 1, limit: number = 50) {
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
}