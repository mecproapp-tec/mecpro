import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Client } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: {
    name: string;
    phone: string;
    vehicle: string;
    plate: string;
  }): Promise<Client> {
    return this.prisma.client.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        vehicle: data.vehicle,
        plate: data.plate,
      },
    });
  }

  async findAll(tenantId: string, userRole?: string): Promise<Partial<Client>[]> {
    const where: any = {};
    // Se não for administrador, filtra pelo tenantId
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantId;
    }

    return this.prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicle: true,
        plate: true,
        address: true,
        document: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, tenantId: string, userRole?: string): Promise<Partial<Client>> {
    const where: any = { id };
    // Se não for administrador, filtra também pelo tenantId
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantId;
    }

    const client = await this.prisma.client.findFirst({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        vehicle: true,
        plate: true,
        address: true,
        document: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }

  async update(id: number, tenantId: string, data: Partial<Client>, userRole?: string): Promise<Client> {
    // Verifica se o cliente existe e pertence ao tenant (ou é admin)
    await this.findOne(id, tenantId, userRole);
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, tenantId: string, userRole?: string): Promise<{ message: string }> {
    await this.findOne(id, tenantId, userRole);
    await this.prisma.client.delete({ where: { id } });
    return { message: 'Cliente removido com sucesso' };
  }
}