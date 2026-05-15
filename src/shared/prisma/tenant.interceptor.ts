import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { tenantStorage } from './tenant-middleware';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    let tenantId: string | null = null;
    if (user && user.tenantId) {
      tenantId = user.tenantId;
    } else if (user && user.role === 'SUPER_ADMIN') {
      // Super-admin pode acessar dados sem filtro de tenant
      tenantId = null;
    } else {
      // Rota pública ou sem usuário – não força tenant
      tenantId = null;
    }

    // Executa o handler dentro do AsyncLocalStorage
    return tenantStorage.run({ tenantId }, () => next.handle());
  }
}