import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const [data, total] = await this.prisma.$transaction([
        this.prisma.notification.findMany({
          where: { tenantId },
          include: { appointment: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.count({ where: { tenantId } }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Erro ao listar notificações: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
      include: { appointment: true },
    });
    
    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }
    
    return notification;
  }

  async markAsRead(id: number, tenantId: string) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: { id, tenantId },
      });
      if (!notification) throw new NotFoundException('Notificação não encontrada');
      
      return await this.prisma.notification.update({
        where: { id },
        data: { read: true },
        include: { appointment: true },
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

  async create(tenantId: string, title: string, message: string, appointmentId?: number) {
    try {
      this.logger.log(`Criando notificação para tenant ${tenantId}: ${title}`);
      const notification = await this.prisma.notification.create({
        data: {
          tenantId,
          title,
          message,
          read: false,
          isGlobal: false,
          appointmentId,
        },
        include: { appointment: true },
      });
      this.logger.log(`Notificação criada com ID ${notification.id}`);
      return notification;
    } catch (error) {
      this.logger.error(`Erro ao criar notificação: ${error.message}`);
      throw error;
    }
  }

  async createForAppointment(
    appointmentId: number,
    tenantId: string,
    title: string,
    message: string,
  ) {
    const existing = await this.prisma.notification.findFirst({
      where: { appointmentId, tenantId },
    });
    if (existing) {
      this.logger.log(`Notificação para o agendamento ${appointmentId} já existe (ID ${existing.id})`);
      return existing;
    }

    return this.create(tenantId, title, message, appointmentId);
  }
}