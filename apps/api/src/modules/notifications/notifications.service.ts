import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    try {
      return await this.prisma.notification.findMany({
        where: { tenantId },
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          isGlobal: true,
          createdAt: true,
          appointmentId: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erro ao listar notificações: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(id: number, tenantId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!notification) throw new NotFoundException('Notificação não encontrada');
      return await this.prisma.notification.update({
        where: { id },
        data: { read: true },
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          isGlobal: true,
          createdAt: true,
          appointmentId: true,
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao marcar notificação ${id} como lida: ${error.message}`);
      throw error;
    }
  }

  async markAllAsRead(tenantId: string) {
    try {
      return await this.prisma.notification.updateMany({
        where: { tenantId, read: false },
        data: { read: true },
      });
    } catch (error) {
      this.logger.error(`Erro ao marcar todas como lidas: ${error.message}`);
      throw error;
    }
  }

  async create(tenantId: string, title: string, message: string) {
    try {
      this.logger.log(`Criando notificação para tenant ${tenantId}: ${title}`);
      const notification = await this.prisma.notification.create({
        data: {
          tenantId,
          title,
          message,
          read: false,
          isGlobal: false,
        },
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          isGlobal: true,
          createdAt: true,
          appointmentId: true,
        },
      });
      this.logger.log(`Notificação criada com ID ${notification.id}`);
      return notification;
    } catch (error) {
      this.logger.error(`Erro ao criar notificação: ${error.message}`);
      throw error;
    }
  }
}