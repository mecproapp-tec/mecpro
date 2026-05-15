// apps/api/src/modules/clients/clients.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Client, Prisma } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateClientDto): Promise<Client> {
    try {
      if (!tenantId) {
        throw new BadRequestException('TenantId não informado');
      }
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new BadRequestException('Tenant não encontrado');
      }
      return await this.prisma.client.create({
        data: {
          tenantId,
          name: data.name.trim(),
          phone: data.phone.trim(),
          vehicle: data.vehicle?.trim() || '',
          plate: data.plate?.trim() || '',
          document: data.document?.trim() || '',
          address: data.address?.trim() || '',
        },
      });
    } catch (error) {
      this.logger.error('Erro ao criar cliente', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar cliente');
    }
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take: safeLimit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
    ]);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: number, tenantId: string): Promise<Client> {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return client;
  }

  async update(id: number, tenantId: string, data: UpdateClientDto): Promise<Client> {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }
    await this.findOne(id, tenantId);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.vehicle !== undefined) updateData.vehicle = data.vehicle.trim();
    if (data.plate !== undefined) updateData.plate = data.plate.trim();
    if (data.document !== undefined) updateData.document = data.document.trim();
    if (data.address !== undefined) updateData.address = data.address.trim();

    return this.prisma.client.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number, tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new BadRequestException('TenantId inválido');
    }
    await this.findOne(id, tenantId);
    try {
      await this.prisma.client.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      this.logger.error('Erro ao deletar cliente', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cliente possui registros relacionados (agendamentos, orçamentos ou faturas).',
        );
      }
      throw new InternalServerErrorException('Erro ao excluir cliente');
    }
  }
}