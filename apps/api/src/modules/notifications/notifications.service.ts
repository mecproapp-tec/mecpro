// apps/api/src/modules/notifications/notifications.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, page: number = 1, limit: number = 50) {
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

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
      include: { appointment: true },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    return notification;
  }

  async markAsRead(id: number, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    
    return await this.prisma.notification.update({
      where: { id },
      data: { read: true },
      include: { appointment: true },
    });
  }

  async markAllAsRead(tenantId: string) {
    return await this.prisma.notification.updateMany({
      where: { tenantId, read: false },
      data: { read: true },
    });
  }

  async create(tenantId: string, title: string, message: string, appointmentId?: number) {
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
    return notification;
  }

  async createForUser(userId: number, title: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });
    if (!user) return null;
    return this.prisma.notification.create({
      data: {
        tenantId: user.tenantId,
        title,
        message,
        isGlobal: false,
      },
    });
  }

  async createForAppointment(appointmentId: number, tenantId: string, title: string, message: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { appointmentId, tenantId },
    });
    if (existing) return existing;
    return this.create(tenantId, title, message, appointmentId);
  }

  async delete(id: number, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, tenantId },
    });
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    
    await this.prisma.notification.delete({
      where: { id },
    });
    return { success: true };
  }

  async deleteAllRead(tenantId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { tenantId, read: true },
    });
    return { count: result.count };
  }
}