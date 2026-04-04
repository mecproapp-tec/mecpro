import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PublicShareService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CREATE SHARE
  // =========================
  async create({
    tenantId,
    type,
    resourceId,
    pdfUrl,
    expiresInDays = 7,
  }: {
    tenantId: string;
    type: 'ESTIMATE' | 'INVOICE';
    resourceId: number;
    pdfUrl: string;
    expiresInDays?: number;
  }) {
    const token = randomUUID();

    const expiresAt = new Date(
      Date.now() + expiresInDays * 86400000,
    );

    return this.prisma.publicShare.create({
      data: {
        token,
        tenantId,
        type,
        resourceId,
        pdfUrl,
        expiresAt,
      },
    });
  }

  // =========================
  // FIND BY TOKEN (VALIDADO)
  // =========================
  async findByToken(token: string) {
    const share = await this.prisma.publicShare.findUnique({
      where: { token },
    });

    if (!share) {
      throw new NotFoundException('Link inválido');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new UnauthorizedException('Link expirado');
    }

    return share;
  }

  // =========================
  // GET FULL DATA (PDF + DADOS)
  // =========================
  async getPublicData(token: string) {
    const share = await this.findByToken(token);

    if (share.type === 'ESTIMATE') {
      const estimate = await this.prisma.estimate.findUnique({
        where: { id: share.resourceId },
        include: {
          client: true,
          items: true,
          tenant: true,
        },
      });

      if (!estimate) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      return {
        type: 'ESTIMATE',
        pdfUrl: share.pdfUrl,
        data: estimate,
      };
    }

    if (share.type === 'INVOICE') {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: share.resourceId },
        include: {
          client: true,
          items: true,
          tenant: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      return {
        type: 'INVOICE',
        pdfUrl: share.pdfUrl,
        data: invoice,
      };
    }

    throw new NotFoundException('Tipo inválido');
  }

  // =========================
  // REGENERAR LINK (opcional)
  // =========================
  async regenerate(token: string) {
    const share = await this.findByToken(token);

    const newToken = randomUUID();

    return this.prisma.publicShare.update({
      where: { id: share.id },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
  }

  // =========================
  // DELETE (opcional)
  // =========================
  async delete(token: string) {
    const share = await this.findByToken(token);

    return this.prisma.publicShare.delete({
      where: { id: share.id },
    });
  }
}