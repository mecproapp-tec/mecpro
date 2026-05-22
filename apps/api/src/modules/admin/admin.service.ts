import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantStatus, ClientStatus, UserStatus, UserRole } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';
import { EstimatesService } from '../estimates/estimates.service';
import { PdfService } from '../pdf/pdf.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { PaymentService } from '../../payments/payment.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
    private estimatesService: EstimatesService,
    private pdfService: PdfService,
    private mailService: MailService,
    private paymentService: PaymentService,
  ) {}

  async getDashboard() {
    // Exclui o tenant administrativo de todas as contagens
    const adminTenantId = '00000000-0000-0000-0000-000000000001';
    const [totalTenants, activeTenants, blockedTenants, totalClients, totalEstimates, totalInvoices, recentTenants] =
      await Promise.all([
        this.prisma.tenant.count({ where: { id: { not: adminTenantId } } }),
        this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE, id: { not: adminTenantId } } }),
        this.prisma.tenant.count({ where: { status: TenantStatus.BLOCKED, id: { not: adminTenantId } } }),
        this.prisma.client.count(),
        this.prisma.estimate.count(),
        this.prisma.invoice.count(),
        this.prisma.tenant.findMany({
          where: { id: { not: adminTenantId } },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, createdAt: true, status: true },
        }),
      ]);
    return { totalTenants, activeTenants, blockedTenants, totalClients, totalEstimates, totalInvoices, recentTenants };
  }

  async getTenants(query: { status?: string; search?: string }) {
    const adminTenantId = '00000000-0000-0000-0000-000000000001';
    const where: any = {
      id: { not: adminTenantId },
    };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.tenant.findMany({
      where,
      include: { _count: { select: { clients: true, estimates: true, invoices: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        clients: true,
        estimates: { include: { client: true } },
        invoices: { include: { client: true } },
        users: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    if (tenant.estimates) {
      tenant.estimates = tenant.estimates.map((e: any) => ({ ...e, total: Number(e.total) }));
    }
    if (tenant.invoices) {
      tenant.invoices = tenant.invoices.map((i: any) => ({ ...i, total: Number(i.total) }));
    }
    return tenant;
  }

  async updateTenantStatus(id: string, status: TenantStatus) {
    return this.prisma.tenant.update({ where: { id }, data: { status } });
  }

  async deleteTenant(id: string) {
    await this.prisma.tenant.delete({ where: { id } });
  }

  async getFinancialSummary(query: { month?: number; year?: number }) {
    return { message: 'Implementar resumo financeiro' };
  }

  async getAllClients(user: any, query: { search?: string; tenantId?: string }) {
    const where: any = {};
    if (user.role === 'ADMIN' && query.tenantId) where.tenantId = query.tenantId;
    else if (user.role === 'SUPER_ADMIN' && query.tenantId) where.tenantId = query.tenantId;
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

  async getClientById(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { tenant: true, estimates: true, invoices: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async blockClient(id: number) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return this.prisma.client.update({ where: { id }, data: { status: ClientStatus.BLOCKED } });
  }

  async activateClient(id: number) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return this.prisma.client.update({ where: { id }, data: { status: ClientStatus.ACTIVE } });
  }

  async sendMessageToClient(clientId: number, data: { subject: string; message: string }) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { tenant: true, user: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    await this.prisma.notification.create({
      data: { tenantId: client.tenantId, title: data.subject, message: data.message, isGlobal: false },
    });
    if (client.user?.email) {
      await this.mailService.sendEmail(client.user.email, data.subject, data.message).catch(err => console.error(err));
    }
    return { success: true, message: 'Mensagem enviada com sucesso' };
  }

  async getAllEstimates(user: any, query: { status?: string; tenantId?: string }) {
    const where: any = {};
    if (user.role === 'ADMIN' && query.tenantId) where.tenantId = query.tenantId;
    else if (user.role === 'SUPER_ADMIN' && query.tenantId) where.tenantId = query.tenantId;
    if (query.status) where.status = query.status;
    const estimates = await this.prisma.estimate.findMany({
      where,
      include: { client: { select: { name: true } }, tenant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return estimates.map(e => ({ ...e, total: Number(e.total), clientName: e.client?.name, tenantName: e.tenant?.name }));
  }

  async getEstimatePdf(id: number) {
    const estimate = await this.prisma.estimate.findUnique({
      where: { id },
      include: { items: true, client: true, tenant: true },
    });
    if (!estimate) throw new NotFoundException('Orçamento não encontrado');
    return this.pdfService.generateEstimatePdf(estimate);
  }

  async getAllInvoices(user: any, query: { status?: string; tenantId?: string }) {
    const where: any = {};
    if (user.role === 'ADMIN' && query.tenantId) where.tenantId = query.tenantId;
    else if (user.role === 'SUPER_ADMIN' && query.tenantId) where.tenantId = query.tenantId;
    if (query.status) where.status = query.status;
    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { client: { select: { name: true } }, tenant: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map(i => ({ ...i, total: Number(i.total), clientName: i.client?.name, tenantName: i.tenant?.name }));
  }

  async getInvoicePdf(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true, client: true, tenant: true },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada');
    return this.pdfService.generateInvoicePdf(invoice);
  }

  async getAllUsers(userRole: string, query: { search?: string; role?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role;
    if (userRole === 'ADMIN') {
      where.role = { not: 'SUPER_ADMIN' };
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
  }

  async blockUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.BLOCKED, tokenVersion: { increment: 1 } } });
  }

  async activateUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.ACTIVE, tokenVersion: { increment: 1 } } });
  }

  async sendNotification(data: { title: string; message: string; target: string; tenantIds?: string[] }) {
    if (data.target === 'all') {
      const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
      const notificationData = tenants.map(t => ({ tenantId: t.id, title: data.title, message: data.message, isGlobal: true }));
      await this.prisma.notification.createMany({ data: notificationData });
    } else if (data.tenantIds?.length) {
      const notificationData = data.tenantIds.map(tenantId => ({ tenantId, title: data.title, message: data.message, isGlobal: false }));
      await this.prisma.notification.createMany({ data: notificationData });
    }
    return { success: true };
  }

  async scheduleNotification(data: any) {
    return { success: true, scheduled: true };
  }

  async getNotifications() {
    return this.prisma.notification.findMany({
      include: { tenant: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead() {
    await this.prisma.notification.updateMany({ data: { read: true } });
    return { success: true };
  }

  async deleteNotification(id: number) {
    await this.prisma.notification.delete({ where: { id } });
  }

  async getAllContactMessages(query: { status?: string; search?: string }) {
    const where: any = {};
    if (query.status && query.status !== 'all') where.status = query.status;
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

  async replyToContactMessage(id: number, replyText: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { reply: replyText, status: 'replied' },
    });
    if (message.userEmail) {
      await this.mailService.sendEmail(message.userEmail, 'Resposta do suporte MecPro', `Olá,\n\nSua mensagem foi respondida:\n\n"${replyText}"\n\nAtenciosamente,\nEquipe MecPro`).catch(err => console.error(err));
    }
    return updated;
  }

  async deleteContactMessage(id: number) {
    await this.prisma.contactMessage.delete({ where: { id } });
  }

  async getAdmins(query: { search?: string }) {
    const where: any = { role: 'ADMIN' };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getPendingAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN', adminApproval: 'PENDING', status: 'ACTIVE' },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  async blockAdmin(id: number, currentUserRole: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Administrador não encontrado');
    if (admin.role !== 'ADMIN') throw new BadRequestException('Usuário não é um administrador');
    if (currentUserRole !== 'SUPER_ADMIN') throw new ForbiddenException('Apenas Super Admin pode bloquear administradores');
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.BLOCKED, tokenVersion: { increment: 1 } } });
  }

  async activateAdmin(id: number, currentUserRole: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Administrador não encontrado');
    if (admin.role !== 'ADMIN') throw new BadRequestException('Usuário não é um administrador');
    if (currentUserRole !== 'SUPER_ADMIN') throw new ForbiddenException('Apenas Super Admin pode ativar administradores');
    return this.prisma.user.update({ where: { id }, data: { status: UserStatus.ACTIVE, tokenVersion: { increment: 1 } } });
  }

  async resetAdminPassword(id: number, currentUserRole: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Administrador não encontrado');
    if (admin.role !== 'ADMIN') throw new BadRequestException('Usuário não é um administrador');
    if (currentUserRole !== 'SUPER_ADMIN') throw new ForbiddenException('Apenas Super Admin pode resetar senha de administradores');
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword, tokenVersion: { increment: 1 } } });
    await this.mailService.sendEmail(admin.email, 'Nova senha - MecPro Admin', `Sua nova senha para acessar o painel administrativo é: ${newPassword}\n\nRecomendamos alterá-la após o primeiro acesso.`);
    return { success: true, message: 'Senha resetada e enviada por e-mail' };
  }

  async deleteAdmin(id: number, currentUserRole: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Administrador não encontrado');
    if (admin.role !== 'ADMIN') throw new BadRequestException('Usuário não é um administrador');
    if (currentUserRole !== 'SUPER_ADMIN') throw new ForbiddenException('Apenas Super Admin pode remover administradores');
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async cancelUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.role !== 'OWNER') throw new BadRequestException('Apenas usuários comuns (OWNER) podem ser cancelados');
    return this.prisma.user.update({ where: { id: userId }, data: { status: 'CANCELED', tokenVersion: { increment: 1 } } });
  }

  async resetUserPassword(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashedPassword, tokenVersion: { increment: 1 } } });
    await this.mailService.sendEmail(user.email, 'Nova senha - MecPro', `Sua nova senha é: ${newPassword}`);
    return { success: true, message: 'Senha resetada e enviada por e-mail' };
  }

  async cancelTenantSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { subscriptionId: true } });
    if (!tenant || !tenant.subscriptionId) throw new BadRequestException('Nenhuma assinatura ativa encontrada');
    const cancelled = await this.paymentService.cancelSubscription(tenant.subscriptionId);
    if (cancelled) {
      await this.prisma.tenant.update({ where: { id: tenantId }, data: { status: 'CANCELED', paymentStatus: 'CANCELED' } });
      await this.prisma.subscription.updateMany({ where: { tenantId, status: 'ACTIVE' }, data: { status: 'CANCELED' } });
    }
    return { success: cancelled };
  }

  async getTenantTotals(tenantId: string) {
    const [clientsCount, estimatesCount, invoicesCount, estimatesTotal, invoicesTotal] = await Promise.all([
      this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.estimate.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.invoice.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.estimate.aggregate({ where: { tenantId, deletedAt: null }, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ where: { tenantId, deletedAt: null }, _sum: { total: true } }),
    ]);
    return {
      clients: clientsCount,
      estimates: estimatesCount,
      invoices: invoicesCount,
      estimatesTotal: estimatesTotal._sum.total || 0,
      invoicesTotal: invoicesTotal._sum.total || 0,
    };
  }
}