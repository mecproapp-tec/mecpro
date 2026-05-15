import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    this.logger.log(`Buscando tenant com ID: ${id}`);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        documentType: true,
        documentNumber: true,
        cep: true,
        address: true,
        number: true,
        complement: true,
        email: true,
        phone: true,
        logoUrl: true,
        status: true,
        trialEndsAt: true,
        createdAt: true,
        updatedAt: true,
        paymentStatus: true,
        subscriptionId: true,
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
        subscriptions: {
          select: { id: true, planName: true, price: true, status: true, startDate: true, endDate: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Oficina não encontrada');
    return tenant;
  }

  async update(id: string, data: any) {
    this.logger.log(`Atualizando tenant ${id} com dados:`, data);
    const updateData: any = {};

    if (data.nome !== undefined) updateData.name = data.nome;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.documento !== undefined) updateData.documentNumber = data.documento;
    if (data.documentNumber !== undefined) updateData.documentNumber = data.documentNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.telefone !== undefined) updateData.phone = data.telefone;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.logo !== undefined) updateData.logoUrl = data.logo;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.tipoDocumento !== undefined) updateData.documentType = data.tipoDocumento;
    if (data.documentType !== undefined) updateData.documentType = data.documentType;
    if (data.endereco !== undefined) updateData.address = data.endereco;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.numero !== undefined) updateData.number = data.numero;
    if (data.number !== undefined) updateData.number = data.number;
    if (data.complemento !== undefined) updateData.complement = data.complemento;
    if (data.complement !== undefined) updateData.complement = data.complement;
    if (data.cep !== undefined) updateData.cep = data.cep;

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        documentNumber: true,
        email: true,
        phone: true,
        logoUrl: true,
        address: true,
        number: true,
        complement: true,
        documentType: true,
        updatedAt: true,
      },
    });
    this.logger.log(`Tenant ${id} atualizado com sucesso`);
    return updated;
  }
}