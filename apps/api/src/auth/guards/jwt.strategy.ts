// src/auth/guards/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'SUPER_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    // Busca o usuário com o tenant (importante!)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true }, // 🔥 INCLUI O TENANT
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Valida sessão
    if (!payload.sessionToken) {
      throw new UnauthorizedException('Token de sessão não fornecido');
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionToken: payload.sessionToken,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }

    // 🔥 BLOQUEIO POR ASSINATURA (exceto SUPER_ADMIN)
    if (user.role !== 'SUPER_ADMIN') {
      const tenant = user.tenant;
      if (!tenant) {
        throw new UnauthorizedException('Tenant não encontrado');
      }

      // 1. Verifica status do tenant (ACTIVE, BLOCKED, CANCELED)
      if (tenant.status !== 'ACTIVE') {
        throw new UnauthorizedException('Assinatura inativa. Regularize o pagamento.');
      }

      // 2. Verifica paymentStatus (paid, trial, pending, expired, canceled)
      const allowedPayment = ['paid', 'trial'];
      if (!allowedPayment.includes(tenant.paymentStatus ?? '')) {
        throw new UnauthorizedException('Pagamento pendente. Regularize sua assinatura.');
      }

      // 3. Verifica trial expirado
      if (tenant.paymentStatus === 'trial' && tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
        throw new UnauthorizedException('Período de teste expirado. Assine um plano.');
      }
    }

    // Atualiza última atividade da sessão
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      sessionToken: payload.sessionToken,
    };
  }
}