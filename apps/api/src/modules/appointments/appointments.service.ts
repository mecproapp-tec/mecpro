import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { clientId: number; date: string; comment?: string }) {
    const appointmentDate = new Date(data.date);

    return this.prisma.appointment.create({
      data: {
        clientId: data.clientId,
        tenantId,
        date: appointmentDate,
        comment: data.comment,
      },
      include: { client: true },
    });
  }

  async findAll(tenantId: string, userRole?: string) {
    const where: any = {};
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantId;
    }
    return this.prisma.appointment.findMany({
      where,
      include: { client: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number, tenantId: string, userRole?: string) {
    const where: any = { id };
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      where.tenantId = tenantId;
    }
    const appointment = await this.prisma.appointment.findFirst({
      where,
      include: { client: true },
    });
    if (!appointment) throw new NotFoundException('Agendamento não encontrado');
    return appointment;
  }

  async update(id: number, tenantId: string, data: { clientId: number; date: string; comment?: string }, userRole?: string) {
    await this.findOne(id, tenantId, userRole);

    const appointmentDate = new Date(data.date);

    return this.prisma.appointment.update({
      where: { id },
      data: {
        clientId: data.clientId,
        date: appointmentDate,
        comment: data.comment,
      },
      include: { client: true },
    });
  }

  async remove(id: number, tenantId: string, userRole?: string) {
    await this.findOne(id, tenantId, userRole);
    await this.prisma.appointment.delete({ where: { id } });
    return { message: 'Agendamento removido com sucesso' };
  }
}