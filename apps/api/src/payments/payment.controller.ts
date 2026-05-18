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

import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../shared/prisma/prisma.service';

// ✅ IMPORTAÇÃO CORRETA DO DTO
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // =========================================================
  // CRIAR ASSINATURA
  // =========================================================

  @Public()
  @Post('create-subscription')
  @HttpCode(HttpStatus.OK)
  async createSubscription(@Body() body: CreateSubscriptionDto) {
    console.log('\n🔵 CRIANDO ASSINATURA REAL 🔵');
    console.log('📥 BODY RECEBIDO:', body);

    const {
      email,
      officeName,
      documentType,
      documentNumber,
      phone,
      cep,
      address,
      externalReference,
    } = body;

    // =========================================
    // VALIDAÇÃO EXTRA
    // =========================================

    if (!email?.trim()) {
      throw new BadRequestException('Email é obrigatório');
    }

    // =========================================
    // GERAR EXTERNAL REFERENCE
    // =========================================

    const finalExternalRef = externalReference || randomUUID();

    // =========================================
    // URL DE RETORNO (CORRIGIDA)
    // =========================================

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    if (!frontendUrl) {
      throw new BadRequestException(
        'FRONTEND_URL não configurada no backend',
      );
    }

    const backUrl = `${frontendUrl}/register/success`;

    // =========================================
    // REMOVER PENDENTE ANTIGO
    // =========================================

    const existingPending =
      await this.prisma.pendingSubscription.findUnique({
        where: { email },
      });

    if (existingPending) {
      console.log('⚠️ PendingSubscription antiga encontrada. Removendo...');

      await this.prisma.pendingSubscription.delete({
        where: { email },
      });
    }

    // =========================================
    // CRIAR PENDING SUBSCRIPTION
    // =========================================

    const pending = await this.prisma.pendingSubscription.create({
      data: {
        email,
        planId: 'plano_mecpro_mensal',

        trialEndsAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),

        status: 'pending',

        officeName: officeName || '',
        documentType: documentType || 'CPF',
        documentNumber: documentNumber || '',
        phone: phone || '',
        cep: cep || '',
        address: address || '',
      },
    });

    console.log('✅ PendingSubscription criada:', pending.id);

    // =========================================
    // CRIAR ASSINATURA NO MERCADO PAGO
    // =========================================

    const { checkoutLink, preapprovalId } =
      await this.paymentService.createSubscription({
        email,
        externalReference: finalExternalRef,
        backUrl,
      });

    // =========================================
    // SALVAR PREAPPROVALID
    // =========================================

    await this.prisma.pendingSubscription.update({
      where: { id: pending.id },
      data: {
        subscriptionId: preapprovalId,
      },
    });

    console.log(`✅ Assinatura criada no MP: ${preapprovalId}`);

    // =========================================
    // RESPOSTA
    // =========================================

    return {
      success: true,
      checkoutLink,
      preapprovalId,
      pendingId: pending.id,
    };
  }

  // =========================================================
  // STATUS DA ASSINATURA
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Get('subscription-status')
  async getSubscriptionStatus(
    @CurrentUser() user: UserPayload,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },

      select: {
        id: true,
        status: true,
        paymentStatus: true,
        trialEndsAt: true,
        subscriptionId: true,

        subscriptions: {
          orderBy: {
            createdAt: 'desc',
          },

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
      throw new BadRequestException(
        'Tenant não encontrado',
      );
    }

    const currentSubscription =
      tenant.subscriptions[0] || null;

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

  // =========================================================
  // CANCELAR ASSINATURA
  // =========================================================

  @UseGuards(JwtAuthGuard)
  @Post('cancel-subscription')
  async cancelSubscription(
    @CurrentUser() user: UserPayload,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: user.tenantId,
      },

      select: {
        subscriptionId: true,
        id: true,
      },
    });

    if (!tenant || !tenant.subscriptionId) {
      throw new BadRequestException(
        'Nenhuma assinatura ativa encontrada',
      );
    }

    const cancelled =
      await this.paymentService.cancelSubscription(
        tenant.subscriptionId,
      );

    if (cancelled) {
      await this.prisma.tenant.update({
        where: {
          id: tenant.id,
        },

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