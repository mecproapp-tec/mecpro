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
      secretOrKey: configService.get<string>('JWT_SECRET') || 'SUPER_SECRET_KEY',
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Token inválido');
    }

    if (payload.sub && typeof payload.sub === 'string' && payload.sub.startsWith('sa_')) {
      const superAdminId = payload.sub.substring(3);
      const superAdmin = await this.prisma.superAdmin.findUnique({
        where: { id: superAdminId },
      });
      if (!superAdmin) {
        throw new UnauthorizedException('Super Admin não encontrado');
      }
      return {
        id: superAdmin.id,
        email: superAdmin.email,
        isSuperAdmin: true,
        role: 'SUPER_ADMIN',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionToken: payload.sessionToken,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      sessionToken: payload.sessionToken,
      isSuperAdmin: false,
    };
  }
}