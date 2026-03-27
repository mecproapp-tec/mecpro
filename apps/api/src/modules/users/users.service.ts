import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, userRole?: string) {
    const where: any = {};
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
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

  async findOne(id: number, tenantId: string, userRole?: string) {
    const where: any = { id };
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
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

  async update(id: number, tenantId: string, data: any, userRole?: string) {
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

  async remove(id: number, tenantId: string, userRole?: string) {
    await this.findOne(id, tenantId, userRole);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Usuário removido com sucesso' };
  }
}