// src/modules/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 🔥 BUG #4 CORRIGIDO: Apenas SUPER_ADMIN vê todos os tenants
  async findAll(tenantId: string, userRole?: string) {
    const where: any = {};
    
    // ✅ CORREÇÃO: Apenas SUPER_ADMIN pode ver usuários de outros tenants
    // ADMIN e OWNER veem apenas seu próprio tenant
    if (userRole !== 'SUPER_ADMIN') {
      where.tenantId = tenantId;
    }
    
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔥 BUG #4 CORRIGIDO: Isolamento de tenant para findOne
  async findOne(id: number, tenantId: string, userRole?: string) {
    const where: any = { id };
    
    // ✅ CORREÇÃO: Apenas SUPER_ADMIN pode ver usuários de outros tenants
    if (userRole !== 'SUPER_ADMIN') {
      where.tenantId = tenantId;
    }
    
    const user = await this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  // 🔥 MELHORIA: Impedir que ADMIN modifique SUPER_ADMIN
  async update(id: number, tenantId: string, data: any, userRole?: string, currentUserId?: number) {
    // Buscar o usuário que será atualizado
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, tenantId: true },
    });
    
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');
    
    // ✅ CORREÇÃO: ADMIN não pode modificar SUPER_ADMIN
    if (userRole === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Não é permitido modificar um administrador global');
    }
    
    // ✅ CORREÇÃO: ADMIN só pode modificar usuários do seu tenant
    if (userRole === 'ADMIN' && targetUser.tenantId !== tenantId) {
      throw new ForbiddenException('Não é permitido modificar usuários de outras oficinas');
    }
    
    // ✅ CORREÇÃO: Usuário não pode modificar a si mesmo (evitar remover próprio acesso)
    if (currentUserId && targetUser.id === currentUserId && (data.role || data.tenantId)) {
      throw new ForbiddenException('Não é permitido alterar seu próprio papel ou tenant');
    }
    
    // Validar acesso do usuário atual (para não-ADMIN)
    await this.findOne(id, tenantId, userRole);
    
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        updatedAt: true,
      },
    });
  }

  // 🔥 MELHORIA: Impedir remoção indevida
  async remove(id: number, tenantId: string, userRole?: string, currentUserId?: number) {
    // Buscar o usuário que será removido
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, tenantId: true },
    });
    
    if (!targetUser) throw new NotFoundException('Usuário não encontrado');
    
    // ✅ CORREÇÃO: ADMIN não pode remover SUPER_ADMIN
    if (userRole === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Não é permitido remover um administrador global');
    }
    
    // ✅ CORREÇÃO: ADMIN só pode remover usuários do seu tenant
    if (userRole === 'ADMIN' && targetUser.tenantId !== tenantId) {
      throw new ForbiddenException('Não é permitido remover usuários de outras oficinas');
    }
    
    // ✅ CORREÇÃO: Usuário não pode remover a si mesmo
    if (currentUserId && targetUser.id === currentUserId) {
      throw new ForbiddenException('Não é permitido remover seu próprio usuário');
    }
    
    await this.findOne(id, tenantId, userRole);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário removido com sucesso' };
  }
}