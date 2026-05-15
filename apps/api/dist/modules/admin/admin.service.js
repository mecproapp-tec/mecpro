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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const client_1 = require("@prisma/client");
const invoices_service_1 = require("../invoices/invoices.service");
const estimates_service_1 = require("../estimates/estimates.service");
const pdf_service_1 = require("../pdf/pdf.service");
const mail_service_1 = require("../mail/mail.service");
let AdminService = class AdminService {
    constructor(prisma, invoicesService, estimatesService, pdfService, mailService) {
        this.prisma = prisma;
        this.invoicesService = invoicesService;
        this.estimatesService = estimatesService;
        this.pdfService = pdfService;
        this.mailService = mailService;
    }
    async getDashboard() {
        const [totalTenants, activeTenants, blockedTenants, totalClients, totalEstimates, totalInvoices, recentTenants] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { status: client_1.TenantStatus.ACTIVE } }),
            this.prisma.tenant.count({ where: { status: client_1.TenantStatus.BLOCKED } }),
            this.prisma.client.count(),
            this.prisma.estimate.count(),
            this.prisma.invoice.count(),
            this.prisma.tenant.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, createdAt: true, status: true },
            }),
        ]);
        return {
            totalTenants,
            activeTenants,
            blockedTenants,
            totalClients,
            totalEstimates,
            totalInvoices,
            recentTenants,
        };
    }
    async getTenants(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.tenant.findMany({
            where,
            include: {
                _count: { select: { clients: true, estimates: true, invoices: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTenant(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                clients: true,
                estimates: { include: { client: true } },
                invoices: { include: { client: true } },
                users: true,
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant não encontrado');
        if (tenant.estimates) {
            tenant.estimates = tenant.estimates.map((e) => ({
                ...e,
                total: Number(e.total),
            }));
        }
        if (tenant.invoices) {
            tenant.invoices = tenant.invoices.map((i) => ({
                ...i,
                total: Number(i.total),
            }));
        }
        return tenant;
    }
    async updateTenantStatus(id, status) {
        return this.prisma.tenant.update({ where: { id }, data: { status } });
    }
    async deleteTenant(id) {
        await this.prisma.tenant.delete({ where: { id } });
    }
    async getFinancialSummary(query) {
        return { message: 'Implementar resumo financeiro' };
    }
    async getAllClients(user, query) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN') {
            where.tenantId = user.tenantId;
        }
        if (query.tenantId && user.role === 'SUPER_ADMIN') {
            where.tenantId = query.tenantId;
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { vehicle: { contains: query.search, mode: 'insensitive' } },
                { plate: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const clients = await this.prisma.client.findMany({
            where,
            include: { tenant: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return clients.map(c => ({ ...c, tenantName: c.tenant?.name }));
    }
    async getClientById(id) {
        const client = await this.prisma.client.findUnique({
            where: { id },
            include: { tenant: true, estimates: true, invoices: true },
        });
        if (!client)
            throw new common_1.NotFoundException('Cliente não encontrado');
        return client;
    }
    async blockClient(id) {
        const client = await this.prisma.client.findUnique({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException('Cliente não encontrado');
        return this.prisma.client.update({
            where: { id },
            data: { status: client_1.ClientStatus.BLOCKED },
        });
    }
    async activateClient(id) {
        const client = await this.prisma.client.findUnique({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException('Cliente não encontrado');
        return this.prisma.client.update({
            where: { id },
            data: { status: client_1.ClientStatus.ACTIVE },
        });
    }
    async sendMessageToClient(clientId, data) {
        const client = await this.prisma.client.findUnique({
            where: { id: clientId },
            include: { tenant: true, user: true },
        });
        if (!client)
            throw new common_1.NotFoundException('Cliente não encontrado');
        await this.prisma.notification.create({
            data: {
                tenantId: client.tenantId,
                title: data.subject,
                message: data.message,
                isGlobal: false,
            },
        });
        if (client.user?.email) {
            await this.mailService.sendEmail(client.user.email, data.subject, data.message).catch(err => console.error('Erro ao enviar e-mail:', err));
        }
        else {
            console.log(`[EMAIL] Cliente ${client.name} (${client.tenantId}) não possui email.`);
        }
        return { success: true, message: 'Mensagem enviada com sucesso' };
    }
    async getAllEstimates(user, query) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN') {
            where.tenantId = user.tenantId;
        }
        if (query.tenantId && user.role === 'SUPER_ADMIN') {
            where.tenantId = query.tenantId;
        }
        if (query.status)
            where.status = query.status;
        const estimates = await this.prisma.estimate.findMany({
            where,
            include: { client: { select: { name: true } }, tenant: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return estimates.map(e => ({
            ...e,
            total: Number(e.total),
            clientName: e.client?.name,
            tenantName: e.tenant?.name,
        }));
    }
    async getEstimatePdf(id) {
        const estimate = await this.prisma.estimate.findUnique({
            where: { id },
            include: { items: true, client: true, tenant: true },
        });
        if (!estimate)
            throw new common_1.NotFoundException('Orçamento não encontrado');
        return this.pdfService.generateEstimatePdf(estimate);
    }
    async getAllInvoices(user, query) {
        const where = {};
        if (user.role !== 'SUPER_ADMIN') {
            where.tenantId = user.tenantId;
        }
        if (query.tenantId && user.role === 'SUPER_ADMIN') {
            where.tenantId = query.tenantId;
        }
        if (query.status)
            where.status = query.status;
        const invoices = await this.prisma.invoice.findMany({
            where,
            include: { client: { select: { name: true } }, tenant: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return invoices.map(i => ({
            ...i,
            total: Number(i.total),
            clientName: i.client?.name,
            tenantName: i.tenant?.name,
        }));
    }
    async getInvoicePdf(id) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true, client: true, tenant: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Fatura não encontrada');
        return this.pdfService.generateInvoicePdf(invoice);
    }
    async getAllUsers(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.role)
            where.role = query.role;
        return this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    async blockUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return this.prisma.user.update({
            where: { id },
            data: {
                status: client_1.UserStatus.BLOCKED,
                tokenVersion: { increment: 1 },
            },
        });
    }
    async activateUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return this.prisma.user.update({
            where: { id },
            data: {
                status: client_1.UserStatus.ACTIVE,
                tokenVersion: { increment: 1 },
            },
        });
    }
    async sendNotification(data) {
        if (data.target === 'all') {
            const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
            const notificationData = tenants.map(t => ({
                tenantId: t.id,
                title: data.title,
                message: data.message,
                isGlobal: true,
            }));
            await this.prisma.notification.createMany({ data: notificationData });
        }
        else if (data.tenantIds?.length) {
            const notificationData = data.tenantIds.map(tenantId => ({
                tenantId,
                title: data.title,
                message: data.message,
                isGlobal: false,
            }));
            await this.prisma.notification.createMany({ data: notificationData });
        }
        return { success: true };
    }
    async scheduleNotification(data) {
        return { success: true, scheduled: true };
    }
    async getNotifications() {
        return this.prisma.notification.findMany({
            include: { tenant: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
    async markAsRead(id) {
        return this.prisma.notification.update({ where: { id }, data: { read: true } });
    }
    async markAllAsRead() {
        await this.prisma.notification.updateMany({ data: { read: true } });
        return { success: true };
    }
    async deleteNotification(id) {
        await this.prisma.notification.delete({ where: { id } });
    }
    async getAllContactMessages(query) {
        const where = {};
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.search) {
            where.OR = [
                { userName: { contains: query.search, mode: 'insensitive' } },
                { userEmail: { contains: query.search, mode: 'insensitive' } },
                { message: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.contactMessage.findMany({
            where,
            include: { tenant: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async replyToContactMessage(id, replyText) {
        const message = await this.prisma.contactMessage.findUnique({ where: { id } });
        if (!message)
            throw new common_1.NotFoundException('Mensagem não encontrada');
        const updated = await this.prisma.contactMessage.update({
            where: { id },
            data: { reply: replyText, status: 'replied' },
        });
        if (message.userEmail) {
            await this.mailService.sendEmail(message.userEmail, 'Resposta do suporte MecPro', `Olá,\n\nSua mensagem foi respondida:\n\n"${replyText}"\n\nAtenciosamente,\nEquipe MecPro`).catch(err => console.error('Erro ao enviar e-mail de resposta:', err));
        }
        return updated;
    }
    async deleteContactMessage(id) {
        await this.prisma.contactMessage.delete({ where: { id } });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        invoices_service_1.InvoicesService,
        estimates_service_1.EstimatesService,
        pdf_service_1.PdfService,
        mail_service_1.MailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map