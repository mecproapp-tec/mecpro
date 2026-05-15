import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PublicShareService {
  constructor(private prisma: PrismaService) {}

  async create({
    tenantId,
    type,
    resourceId,
    expiresInDays = 7,
  }: {
    tenantId: string;
    type: 'ESTIMATE' | 'INVOICE';
    resourceId: number;
    expiresInDays?: number;
  }) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
    return this.prisma.publicShare.create({
      data: { token, tenantId, type, resourceId, expiresAt },
    });
  }

  async findByToken(token: string) {
    const share = await this.prisma.publicShare.findUnique({ where: { token } });
    if (!share) throw new NotFoundException('Link inválido ou expirado');
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new UnauthorizedException('Link expirado');
    }
    return share;
  }

  // 🔥 BUG #3 CORRIGIDO: Adicionado filtro de tenantId nas consultas
  async getPublicData(token: string) {
    const share = await this.findByToken(token);

    if (share.type === 'ESTIMATE') {
      // ✅ CORREÇÃO: Usar findFirst com tenantId para garantir isolamento
      const estimate = await this.prisma.estimate.findFirst({
        where: { 
          id: share.resourceId,
          tenantId: share.tenantId  // 🔥 Filtro de tenant adicionado
        },
        include: { client: true, items: true, tenant: true },
      });
      if (!estimate) throw new NotFoundException('Orçamento não encontrado');

      return {
        id: estimate.id,
        total: Number(estimate.total),
        date: estimate.date,
        status: estimate.status,
        client: {
          id: estimate.client.id,
          name: estimate.client.name,
          phone: estimate.client.phone,
          vehicle: estimate.client.vehicle,
          plate: estimate.client.plate,
          address: estimate.client.address || '',
          document: estimate.client.document || '',
        },
        items: estimate.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          issPercent: item.issPercent ?? 0,
        })),
        tenant: {
          name: estimate.tenant?.name ?? '',
          documentNumber: estimate.tenant?.documentNumber ?? '',
          phone: estimate.tenant?.phone ?? '',
          email: estimate.tenant?.email ?? '',
          logoUrl: estimate.tenant?.logoUrl ?? '',
        },
        pdfUrl: share.pdfUrl || estimate.pdfUrl || '',
      };
    }

    if (share.type === 'INVOICE') {
      // ✅ CORREÇÃO: Usar findFirst com tenantId para garantir isolamento
      const invoice = await this.prisma.invoice.findFirst({
        where: { 
          id: share.resourceId,
          tenantId: share.tenantId  // 🔥 Filtro de tenant adicionado
        },
        include: { client: true, items: true, tenant: true },
      });
      if (!invoice) throw new NotFoundException('Fatura não encontrada');

      return {
        id: invoice.id,
        number: invoice.number,
        total: Number(invoice.total),
        status: invoice.status,
        createdAt: invoice.createdAt,
        client: {
          id: invoice.client.id,
          name: invoice.client.name,
          phone: invoice.client.phone,
          vehicle: invoice.client.vehicle,
          plate: invoice.client.plate,
          address: invoice.client.address || '',
          document: invoice.client.document || '',
        },
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          issPercent: item.issPercent ?? 0,
        })),
        tenant: {
          name: invoice.tenant?.name ?? '',
          documentNumber: invoice.tenant?.documentNumber ?? '',
          phone: invoice.tenant?.phone ?? '',
          email: invoice.tenant?.email ?? '',
          logoUrl: invoice.tenant?.logoUrl ?? '',
        },
        pdfUrl: share.pdfUrl || invoice.pdfUrl || '',
      };
    }

    throw new BadRequestException('Tipo de compartilhamento inválido');
  }

  // 🔥 MELHORIA: Regenerate agora revoga o token antigo (cria novo, deleta antigo)
  async regenerate(token: string) {
    const share = await this.findByToken(token);
    
    // Criar novo token
    const newToken = randomBytes(32).toString('hex');
    const newShare = await this.prisma.publicShare.create({
      data: {
        token: newToken,
        tenantId: share.tenantId,
        type: share.type,
        resourceId: share.resourceId,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    
    // Deletar o token antigo (revogar)
    await this.prisma.publicShare.delete({ where: { id: share.id } });
    
    return newShare;
  }

  async delete(token: string) {
    const share = await this.findByToken(token);
    return this.prisma.publicShare.delete({ where: { id: share.id } });
  }
}