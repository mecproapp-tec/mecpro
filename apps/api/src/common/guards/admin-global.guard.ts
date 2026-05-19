import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGlobalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    if (user.role === 'ADMIN' && !user.tenantId) {
      return true;
    }

    throw new ForbiddenException('Acesso negado. Requer privilégios de administrador global.');
  }
}