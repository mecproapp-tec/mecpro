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
  // 🔥 Só executa se esta instância for a responsável pelos crons
  private readonly cronEnabled = process.env.CRON_INSTANCE === 'true';

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ============================
  // Métodos CRUD (mantidos)
  // ============================

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
    this.logger.log(`📅 Criando agendamento para tenant ${tenantId}, cliente ${data.clientId}`);
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId, tenantId },
    });
    if (!client) throw new BadRequestException('Cliente não encontrado');
    return this.prisma.appointment.create({
      data: {
        tenantId,
        clientId: data.clientId,
        date: new Date(data.date),
        comment: data.comment,
      },
      include: { client: true },
    });
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

  // ============================
  // Job automático (executa a cada minuto) – SOMENTE se CRON_INSTANCE=true
  // ============================

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAppointmentsForNotifications() {
    if (!this.cronEnabled) return; // 🚫 não executa se não for a instância de cron

    if (this.isCronRunning) {
      this.logger.warn('⚠️ Cron job já está em execução. Ignorando nova chamada.');
      return;
    }
    this.isCronRunning = true;

    try {
      this.logger.log('🕒 Job de verificação de agendamentos executado às: ' + new Date().toLocaleString());

      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          date: {
            gte: oneMinuteAgo,
            lte: now,
          },
        },
        include: {
          client: true,
          tenant: true,
        },
      });

      this.logger.log(`Encontrados ${appointments.length} agendamento(s) para notificar.`);

      for (const app of appointments) {
        if (!app.tenantId) {
          this.logger.warn(`Agendamento ${app.id} não possui tenantId. Ignorado.`);
          continue;
        }

        const existingNotification = await this.prisma.notification.findFirst({
          where: {
            appointmentId: app.id,
            title: `🔔 Horário de agendamento: ${app.client.name}`,
          },
        });
        if (existingNotification) {
          this.logger.log(`Notificação para agendamento ${app.id} já existe. Ignorando.`);
          continue;
        }

        const title = `🔔 Horário de agendamento: ${app.client.name}`;
        const message = `Cliente: ${app.client.name}\nVeículo: ${app.client.vehicle || 'Não informado'} - Placa: ${app.client.plate || 'Não informada'}\nHorário: ${new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\nEntre em contato com o cliente.`;

        await this.notificationsService.createForAppointment(
          app.id,
          app.tenantId,
          title,
          message,
        );
      }
    } catch (error) {
      this.logger.error(`Erro no cron job: ${error.message}`);
    } finally {
      this.isCronRunning = false;
    }
  }
}