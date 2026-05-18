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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async findAll(tenantId, page = 1, limit = 50) {
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
        }
        catch (error) {
            this.logger.error(`Erro ao listar notificações: ${error.message}`);
            throw error;
        }
    }
    async findOne(id, tenantId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id, tenantId },
            include: { appointment: true },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        return notification;
    }
    async markAsRead(id, tenantId) {
        try {
            const notification = await this.prisma.notification.findFirst({
                where: { id, tenantId },
            });
            if (!notification)
                throw new common_1.NotFoundException('Notificação não encontrada');
            return await this.prisma.notification.update({
                where: { id },
                data: { read: true },
                include: { appointment: true },
            });
        }
        catch (error) {
            this.logger.error(`Erro ao marcar notificação ${id} como lida: ${error.message}`);
            throw error;
        }
    }
    async markAllAsRead(tenantId) {
        try {
            return await this.prisma.notification.updateMany({
                where: { tenantId, read: false },
                data: { read: true },
            });
        }
        catch (error) {
            this.logger.error(`Erro ao marcar todas como lidas: ${error.message}`);
            throw error;
        }
    }
    async create(tenantId, title, message, appointmentId) {
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
        }
        catch (error) {
            this.logger.error(`Erro ao criar notificação: ${error.message}`);
            throw error;
        }
    }
    async createForAppointment(appointmentId, tenantId, title, message) {
        const existing = await this.prisma.notification.findFirst({
            where: { appointmentId, tenantId },
        });
        if (existing) {
            this.logger.log(`Notificação para o agendamento ${appointmentId} já existe (ID ${existing.id})`);
            return existing;
        }
        return this.create(tenantId, title, message, appointmentId);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map