import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Se não há roles exigidas, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    
    // 🔥 BUG #49 CORRIGIDO: Verificar se user 
    if (!user) {
      throw new ForbiddenException('Acesso negado. Usuário não autenticado.');
    }
    
    // 🔥 Verificar se user tem role
    if (!user.role) {
      throw new ForbiddenException('Acesso negado. Usuário sem papel definido.');
    }
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Função necessária: ${requiredRoles.join(', ')}. Sua função: ${user.role}`
      );
    }
    
    return true;
  }
}