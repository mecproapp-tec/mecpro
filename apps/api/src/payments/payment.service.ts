// src/payments/payment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Obtém uma assinatura (preapproval) do Mercado Pago pelo ID
   */
  async getSubscription(subscriptionId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error.response?.data);
      throw new BadRequestException('Falha ao obter dados da assinatura');
    }
  }

  /**
   * Obtém um pagamento do Mercado Pago pelo ID
   */
  async getPayment(paymentId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error.response?.data);
      throw new BadRequestException('Falha ao obter dados do pagamento');
    }
  }

  /**
   * Cria um link de assinatura (preapproval) no Mercado Pago
   * Utiliza o método antigo com preapproval_plan_id + external_reference
   */
  async createSubscriptionLink(params: {
    externalReference: string;
    payerEmail: string;
    planId: string;
  }) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    const planId = params.planId || this.configService.get('MERCADOPAGO_PLAN_ID');
    if (!planId) {
      throw new BadRequestException('ID do plano não configurado');
    }

    const preapprovalData = {
      preapproval_plan_id: planId,
      payer_email: params.payerEmail,
      external_reference: params.externalReference,
      back_url: `${this.configService.get('FRONTEND_URL')}/billing/success`,
      status: 'pending',
    };

    try {
      const response = await axios.post(
        'https://api.mercadopago.com/preapproval',
        preapprovalData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return { checkoutLink: response.data.init_point };
    } catch (error) {
      console.error('Erro ao criar link de assinatura:', error.response?.data);
      throw new BadRequestException('Falha ao gerar link de pagamento');
    }
  }

  /**
   * Método existente: cria uma assinatura diretamente (sem pending)
   */
  async createSubscription(email: string, planId: string) {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN');
    const preapproval = {
      preapproval_plan_id: planId,
      payer_email: email,
      back_url: `${this.configService.get('FRONTEND_URL')}/cadastro?payment=success`,
      status: 'pending',
    };

    try {
      const response = await axios.post(
        'https://api.mercadopago.com/preapproval',
        preapproval,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return { checkoutUrl: response.data.init_point };
    } catch (error) {
      console.error('Erro ao criar preapproval:', error.response?.data);
      throw new Error('Falha ao iniciar assinatura');
    }
  }

  /**
   * Método existente: cria um pending subscription no banco e gera link de checkout
   */
  async createPendingSubscription(email: string) {
    const planId = this.configService.get('MERCADOPAGO_PLAN_ID');
    if (!planId) {
      throw new Error('MERCADOPAGO_PLAN_ID não configurado');
    }

    const pending = await this.prisma.pendingSubscription.create({
      data: {
        email,
        planId,
        subscriptionId: crypto.randomUUID(), // placeholder
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const checkoutUrl = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${planId}&external_reference=${pending.id}`;

    return { ...pending, checkoutUrl };
  }
}