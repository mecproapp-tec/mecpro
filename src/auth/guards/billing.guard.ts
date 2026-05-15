import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class BillingGuard implements CanActivate {
  // 🔥 BUG #51: Cache simples para evitar consultas repetidas
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private readonly CACHE_TTL = 30000; // 30 segundos

  constructor(private prisma: PrismaService) {}

  private getCachedTenant(tenantId: string): any | null {
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCachedTenant(tenantId: string, data: any): void {
    this.cache.set(tenantId, {
      data,
      expiresAt: Date.now() + this.CACHE_TTL,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant não encontrado no token');
    }

    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // 🔥 BUG #51: Usar cache para evitar consultas repetidas ao banco
    let tenant = this.getCachedTenant(user.tenantId);
    
    if (!tenant) {
      tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });
      
      if (tenant) {
        this.setCachedTenant(user.tenantId, tenant);
      }
    }

    if (!tenant) {
      throw new UnauthorizedException('Tenant não encontrado no sistema');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Sua conta está inativa. Entre em contato com o suporte.',
      );
    }

    const allowedPaymentStatuses = ['PAID', 'TRIAL'];
    if (!allowedPaymentStatuses.includes(tenant.paymentStatus ?? '')) {
      throw new ForbiddenException(
        'Pagamento pendente. Acesse o link de pagamento para regularizar sua assinatura.',
      );
    }

    // 🔥 BUG #50 CORRIGIDO: Comparação de data com fuso horário
    if (
      tenant.paymentStatus === 'TRIAL' &&
      tenant.trialEndsAt
    ) {
      const trialEndUTC = new Date(tenant.trialEndsAt);
      const nowUTC = new Date();
      
      // Comparar timestamps em UTC para evitar problemas de fuso
      if (nowUTC.getTime() > trialEndUTC.getTime()) {
        throw new ForbiddenException(
          'Seu período de teste expirou. Faça o upgrade para continuar usando o sistema.',
        );
      }
    }

    return true;
  }
}