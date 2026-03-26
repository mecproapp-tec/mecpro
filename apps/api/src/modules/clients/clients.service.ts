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

  async findAll(tenantId: string): Promise<Partial<Client>[]> {
    return this.prisma.client.findMany({
      where: { tenantId },
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

  async findOne(id: number, tenantId: string): Promise<Partial<Client>> {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
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

  async update(id: number, tenantId: string, data: Partial<Client>): Promise<Client> {
    await this.findOne(id, tenantId);
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, tenantId: string): Promise<{ message: string }> {
    await this.findOne(id, tenantId);
    await this.prisma.client.delete({ where: { id } });
    return { message: 'Cliente removido com sucesso' };
  }
}