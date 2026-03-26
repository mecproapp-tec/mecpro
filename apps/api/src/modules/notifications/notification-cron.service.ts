import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationCronService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledNotifications() {
    const now = new Date();
    const scheduled = await this.prisma.scheduledNotification.findMany({
      where: { sent: false, schedule: { lte: now } },
    });
    for (const item of scheduled) {
      // Enviar notificação (lógica similar ao sendNotification)
      // ...
      await this.prisma.scheduledNotification.update({
        where: { id: item.id },
        data: { sent: true },
      });
    }
  }
}