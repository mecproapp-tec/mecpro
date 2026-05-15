"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AppointmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AppointmentsService = AppointmentsService_1 = class AppointmentsService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(AppointmentsService_1.name);
        this.isCronRunning = false;
    }
    async findAll(tenantId, page = 1, limit = 50, startDate, endDate) {
        const skip = (page - 1) * limit;
        const where = { tenantId };
        if (startDate)
            where.date = { gte: new Date(startDate) };
        if (endDate)
            where.date = { lte: new Date(endDate) };
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
    async findOne(id, tenantId) {
        const appointment = await this.prisma.appointment.findFirst({
            where: { id, tenantId },
            include: { client: true },
        });
        if (!appointment)
            throw new common_1.NotFoundException('Agendamento não encontrado');
        return appointment;
    }
    async create(tenantId, data) {
        this.logger.log(`📅 Criando agendamento para tenant ${tenantId}, cliente ${data.clientId}`);
        const client = await this.prisma.client.findFirst({
            where: { id: data.clientId, tenantId },
        });
        if (!client)
            throw new common_1.BadRequestException('Cliente não encontrado');
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
    async update(id, tenantId, data) {
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
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.appointment.delete({ where: { id } });
    }
    async checkAppointmentsForNotifications() {
        if (this.isCronRunning) {
            this.logger.warn('⚠️ Cron job já está em execução. Ignorando nova chamada.');
            return;
        }
        this.isCronRunning = true;
        try {
            this.logger.log('🕒 Job de verificação de agendamentos executado às: ' + new Date().toLocaleString());
            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            this.logger.log(`Buscando agendamentos entre ${oneMinuteAgo.toISOString()} e ${now.toISOString()}`);
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
                const message = `Cliente: ${app.client.name}
Veículo: ${app.client.vehicle || 'Não informado'} - Placa: ${app.client.plate || 'Não informada'}
Horário: ${new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
Entre em contato com o cliente.`;
                this.logger.log(`Criando notificação para agendamento ${app.id} (cliente: ${app.client.name})`);
                await this.notificationsService.createForAppointment(app.id, app.tenantId, title, message);
            }
        }
        catch (error) {
            this.logger.error(`Erro no cron job: ${error.message}`);
        }
        finally {
            this.isCronRunning = false;
        }
    }
};
exports.AppointmentsService = AppointmentsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppointmentsService.prototype, "checkAppointmentsForNotifications", null);
exports.AppointmentsService = AppointmentsService = AppointmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map