import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PaymentService } from '../../payments/payment.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
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
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            gatewayPaymentId: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }
    return subscription;
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
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            gatewayPaymentId: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });
    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getSubscriptionStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    const currentSubscription = tenant.subscriptions[0] || null;
    return {
      status: tenant.status,
      paymentStatus: tenant.paymentStatus,
      trialEndsAt: tenant.trialEndsAt,
      subscriptionId: tenant.subscriptionId,
      plan: currentSubscription
        ? {
            name: currentSubscription.planName,
            price: currentSubscription.price,
            endDate: currentSubscription.endDate,
          }
        : null,
    };
  }

  async createCheckout(tenantId: string, email: string) {
    let pending = await this.prisma.pendingSubscription.findFirst({
      where: {
        tenantId,
        status: 'pending',
      },
    });

    if (!pending) {
      const trialDays = 30;
      pending = await this.prisma.pendingSubscription.create({
        data: {
          email,
          tenantId,
          planId: 'PLANO_BASICO',
          trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      });
    }

    try {
      const checkoutLink = await this.paymentService.createSubscriptionLink({
        externalReference: pending.id,
        payerEmail: email,
        planId: pending.planId,
      });
      return { checkoutLink, pendingId: pending.id };
    } catch (error) {
      console.error('Erro ao criar link de assinatura:', error);
      throw new BadRequestException('Erro ao gerar link de pagamento. Tente novamente.');
    }
  }
}