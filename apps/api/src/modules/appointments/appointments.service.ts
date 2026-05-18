// apps/api/src/modules/appointments/appointments.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private isCronRunning = false;
  private readonly cronEnabled = process.env.CRON_INSTANCE === 'true';

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(tenantId: string, page = 1, limit = 50, startDate?: string, endDate?: string) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) where.date = { lte: new Date(endDate) };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: { client: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { client: true },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async create(tenantId: string, data: CreateAppointmentDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });
    if (!client) throw new BadRequestException('Cliente não encontrado');
    
    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        date: new Date(data.date),
        comment: data.comment,
      },
      include: { client: true },
    });

    return appointment;
  }

  async update(id: number, tenantId: string, data: UpdateAppointmentDto) {
    await this.findOne(id, tenantId);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        clientId: data.clientId,
        date: data.date ? new Date(data.date) : undefined,
        comment: data.comment,
      },
      include: { client: true },
    });
  }

  async remove(id: number, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.appointment.delete({ where: { id } });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAppointmentsForNotifications() {
    if (!this.cronEnabled) return;
    if (this.isCronRunning) return;
    this.isCronRunning = true;

    try {
      const now = new Date();
      
      const appointments = await this.prisma.appointment.findMany({
        where: {
          date: {
            gte: new Date(),
          },
        },
        include: {
          client: true,
          tenant: true,
        },
      });

      for (const app of appointments) {
        const appointmentTime = new Date(app.date);
        const diffMs = appointmentTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        
        const shouldNotify = diffMinutes <= 5 && diffMinutes >= 0;
        
        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            appointmentId: app.id,
            title: 'Lembrete: Agendamento em 5 minutos',
          },
        });

        if (shouldNotify && !existingNotification) {
          const title = 'Lembrete: Agendamento em 5 minutos';
          const message = `${app.client.name} - ${app.client.vehicle || 'Veículo'} as ${appointmentTime.toLocaleTimeString('pt-BR')}`;

          await this.notificationsService.createForAppointment(
            app.id,
            app.tenantId,
            title,
            message,
          );
          
          this.logger.log(`Notificação criada para agendamento ${app.id} faltando ${diffMinutes} minutos`);
        }
      }
    } catch (error) {
      this.logger.error(`Erro no cron: ${error.message}`);
    } finally {
      this.isCronRunning = false;
    }
  }
}