import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PaymentService } from '../payments/payment.service'; // vamos importar para consultar a assinatura

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private paymentService: PaymentService, // adicionado
  ) {}

  async signup(data: { name: string; email: string; password: string; tenantId: string }) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        tenantId: String(data.tenantId),
      },
    });
    return user;
  }

  async registerTenant(data: {
    officeName: string;
    documentType: string;
    documentNumber: string;
    cep: string;
    address: string;
    email: string;
    phone: string;
    ownerName: string;
    password: string;
    paymentCompleted: boolean;
    preapprovalId?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new BadRequestException('Email já cadastrado');

    const existingTenant = await this.prisma.tenant.findUnique({ where: { documentNumber: data.documentNumber } });
    if (existingTenant) throw new BadRequestException('Documento já cadastrado');

    // Valida a assinatura com o Mercado Pago
    if (!data.preapprovalId) {
      throw new BadRequestException('ID da assinatura não fornecido.');
    }

    const subscriptionData = await this.paymentService.getSubscription(data.preapprovalId);
    if (subscriptionData.status !== 'authorized') {
      throw new BadRequestException('Assinatura não autorizada ou pendente.');
    }

    // Pega o plano e calcula trial (já vem do MP)
    const trialEndsAt = new Date(subscriptionData.next_payment_date); // ou use data do free trial

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.officeName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        cep: data.cep,
        address: data.address,
        email: data.email,
        phone: data.phone,
        status: 'ACTIVE',
        trialEndsAt,
        subscriptionId: data.preapprovalId,
        paymentStatus: 'trial',
      },
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.ownerName,
        email: data.email,
        password: hashedPassword,
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });

    // Cria a Subscription no nosso banco
    await this.prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planName: 'Plano Mensal',
        price: 149.9,
        status: 'ACTIVE',
        gateway: 'MERCADOPAGO',
        gatewaySubscriptionId: data.preapprovalId,
        startDate: new Date(),
        endDate: trialEndsAt,
      },
    });

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      message: 'Cadastro realizado com sucesso',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        officeName: tenant.name,
      },
    };
  }

  // ... (registerAdmin, login, generateRefreshToken, refreshToken iguais)
}