import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

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
}