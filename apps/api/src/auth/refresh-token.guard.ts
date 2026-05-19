import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token ausente');

    try {
      const payload = this.jwtService.verify(token);

      if (payload.sub && typeof payload.sub === 'string' && payload.sub.startsWith('sa_')) {
        const superAdminId = payload.sub.substring(3);
        const superAdmin = await this.prisma.superAdmin.findUnique({
          where: { id: superAdminId },
        });
        if (!superAdmin) throw new UnauthorizedException('Super Admin não encontrado');
        req.user = { id: superAdmin.id, email: superAdmin.email, isSuperAdmin: true };
        return true;
      }

      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
      if (isNaN(userId)) throw new UnauthorizedException('ID de usuário inválido');

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new UnauthorizedException('Usuário não encontrado');
      req.user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}