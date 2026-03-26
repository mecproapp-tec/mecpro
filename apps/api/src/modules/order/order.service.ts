// src/modules/order/order.service.ts (example optimization)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrderForPdf(tenantId: string, id: string) {
    return this.prisma.order.findUnique({
      where: { id, tenantId },
      select: {
        id: true,
        pdfUrl: true,
        phone: true,
        clientName: true,
        date: true,
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
          },
        },
        total: true,
      },
    });
  }

  preparePdfData(order: any) {
    return {
      title: 'Ordem de Serviço',
      clientName: order.clientName,
      date: order.date.toLocaleDateString('pt-BR'),
      items: order.items,
      total: order.total.toFixed(2),
    };
  }
}