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
var ContactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ContactService = ContactService_1 = class ContactService {
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(ContactService_1.name);
    }
    async create(data) {
        try {
            return await this.prisma.contactMessage.create({
                data: {
                    userEmail: data.userEmail,
                    userName: data.userName,
                    message: data.message,
                    tenantId: data.tenantId,
                    status: 'pending',
                },
            });
        }
        catch (error) {
            this.logger.error(`Erro ao criar mensagem: ${error.message}`);
            throw error;
        }
    }
    async findAll() {
        try {
            return await this.prisma.contactMessage.findMany({
                select: {
                    id: true,
                    userEmail: true,
                    userName: true,
                    message: true,
                    status: true,
                    reply: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (error) {
            this.logger.error(`Erro ao listar mensagens: ${error.message}`);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const message = await this.prisma.contactMessage.findUnique({
                where: { id },
                select: {
                    id: true,
                    userEmail: true,
                    userName: true,
                    message: true,
                    status: true,
                    reply: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            });
            if (!message)
                throw new common_1.NotFoundException('Mensagem não encontrada');
            return message;
        }
        catch (error) {
            this.logger.error(`Erro ao buscar mensagem ${id}: ${error.message}`);
            throw error;
        }
    }
    async reply(id, reply) {
        try {
            const message = await this.prisma.contactMessage.findUnique({
                where: { id },
                select: { tenantId: true },
            });
            if (!message)
                throw new common_1.NotFoundException('Mensagem não encontrada');
            this.logger.log(`Respondendo mensagem ${id} - tenantId: ${message.tenantId}`);
            const updatedMessage = await this.prisma.contactMessage.update({
                where: { id },
                data: { reply, status: 'replied' },
                select: {
                    id: true,
                    userEmail: true,
                    userName: true,
                    message: true,
                    status: true,
                    reply: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: { id: true, name: true, email: true, phone: true },
                    },
                },
            });
            if (message.tenantId) {
                try {
                    await this.notificationsService.create(message.tenantId, 'Resposta do Administrador', reply);
                    this.logger.log(`Notificação criada com sucesso para tenant ${message.tenantId}`);
                }
                catch (notifError) {
                    this.logger.error(`Falha ao criar notificação para tenant ${message.tenantId}: ${notifError.message}`);
                }
            }
            else {
                this.logger.warn(`Mensagem ${id} não possui tenantId, notificação não criada`);
            }
            return updatedMessage;
        }
        catch (error) {
            this.logger.error(`Erro ao responder mensagem ${id}: ${error.message}`);
            throw error;
        }
    }
    async remove(id) {
        try {
            const message = await this.prisma.contactMessage.findUnique({ where: { id } });
            if (!message)
                throw new common_1.NotFoundException('Mensagem não encontrada');
            return await this.prisma.contactMessage.delete({ where: { id } });
        }
        catch (error) {
            this.logger.error(`Erro ao excluir mensagem ${id}: ${error.message}`);
            throw error;
        }
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = ContactService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ContactService);
//# sourceMappingURL=contact.service.js.map