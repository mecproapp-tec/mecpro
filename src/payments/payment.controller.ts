// apps/api/src/payments/payment.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  Get,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../shared/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

class CreateSubscriptionDto {
  email: string;
  officeName?: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  cep?: string;
  address?: string;
  externalReference?: string;
}

@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('create-subscription')
  @HttpCode(HttpStatus.OK)
  async createSubscription(@Body() body: CreateSubscriptionDto) {
    console.log('\n🔵 CRIANDO ASSINATURA REAL (trial 7 dias) 🔵');

    const { email, officeName, documentType, documentNumber, phone, cep, address, externalReference } = body;

    if (!email) throw new BadRequestException('Email é obrigatório');

    const finalExternalRef = externalReference || randomUUID();
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const backUrl = `${frontendUrl}/register?payment=success`;

    // 1. Salvar dados temporários (sem tenantId, pois ainda não existe tenant)
   const pending = await this.prisma.pendingSubscription.create({
  data: {
    email,
    planId: 'plano_mecpro_mensal',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',

    officeName: officeName || '',
    documentType: documentType || 'CPF',
    documentNumber: documentNumber || '',
    phone: phone || '',
    cep: cep || '',
    address: address || '',
  },
});

    // 2. Criar assinatura real no MP
    const { checkoutLink, preapprovalId } = await this.paymentService.createSubscription({
      email,
      externalReference: finalExternalRef,
      backUrl,
    });

    // 3. Atualizar pending com o preapprovalId
    await this.prisma.pendingSubscription.update({
      where: { id: pending.id },
      data: { subscriptionId: preapprovalId },
    });

    console.log(`✅ Assinatura MP: ${preapprovalId}`);
    return {
      success: true,
      checkoutLink,
      preapprovalId,
      pendingId: pending.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription-status')
  async getSubscriptionStatus(@CurrentUser() user: UserPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        trialEndsAt: true,
        subscriptionId: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            planName: true,
            price: true,
            status: true,
            endDate: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    const currentSubscription = tenant.subscriptions[0] || null;

    return {
      success: true,
      data: {
        tenantStatus: tenant.status,
        paymentStatus: tenant.paymentStatus,
        trialEndsAt: tenant.trialEndsAt,
        subscriptionId: tenant.subscriptionId,
        currentPlan: currentSubscription,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel-subscription')
  async cancelSubscription(@CurrentUser() user: UserPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { subscriptionId: true, id: true },
    });

    if (!tenant || !tenant.subscriptionId) {
      throw new BadRequestException('Nenhuma assinatura ativa encontrada');
    }

    const cancelled = await this.paymentService.cancelSubscription(tenant.subscriptionId);

    if (cancelled) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          status: 'CANCELED',
          paymentStatus: 'CANCELED',
        },
      });

      await this.prisma.subscription.updateMany({
        where: {
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
        data: {
          status: 'CANCELED',
        },
      });
    }

    return {
      success: cancelled,
      message: cancelled
        ? 'Assinatura cancelada com sucesso'
        : 'Erro ao cancelar assinatura',
    };
  }
}