import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res, HttpCode, HttpStatus, Req, Logger, BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { TenantStatus } from '@prisma/client';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, SessionGuard, RolesGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('tenants')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTenants(@Query() query: any) {
    return this.adminService.getTenants(query);
  }

  @Get('tenants/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenant(id);
  }

  @Put('tenants/:id/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateTenantStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    return this.adminService.updateTenantStatus(id, status);
  }

  @Delete('tenants/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTenant(@Param('id') id: string) {
    await this.adminService.deleteTenant(id);
  }

  @Get('financial/summary')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getFinancialSummary(@Query() query: any) {
    return this.adminService.getFinancialSummary(query);
  }

  @Get('clients')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllClients(@Req() req: Request, @Query() query: any) {
    return this.adminService.getAllClients((req as any).user, query);
  }

  @Get('clients/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getClientById(@Param('id') id: string) {
    return this.adminService.getClientById(Number(id));
  }

  @Put('clients/:id/block')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async blockClient(@Param('id') id: string) {
    return this.adminService.blockClient(Number(id));
  }

  @Put('clients/:id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async activateClient(@Param('id') id: string) {
    return this.adminService.activateClient(Number(id));
  }

  @Post('clients/:id/send-message')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async sendMessageToClient(@Param('id') id: string, @Body() body: { subject: string; message: string }) {
    return this.adminService.sendMessageToClient(Number(id), body);
  }

  @Get('estimates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllEstimates(@Req() req: Request, @Query() query: any) {
    return this.adminService.getAllEstimates((req as any).user, query);
  }

  @Get('estimates/:id/pdf')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getEstimatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getEstimatePdf(Number(id));
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename=orcamento-${id}.pdf` });
    res.send(pdfBuffer);
  }

  @Get('invoices')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllInvoices(@Req() req: Request, @Query() query: any) {
    return this.adminService.getAllInvoices((req as any).user, query);
  }

  @Get('invoices/:id/pdf')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getInvoicePdf(Number(id));
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename=fatura-${id}.pdf` });
    res.send(pdfBuffer);
  }

  @Get('users')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllUsers(@CurrentUser() user: UserPayload, @Query() query: any) {
    return this.adminService.getAllUsers(user.role, query);
  }

  @Put('users/:id/block')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(Number(id));
  }

  @Put('users/:id/activate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(Number(id));
  }

  @Post('users/:id/cancel')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async cancelUser(@Param('id') id: string) {
    return this.adminService.cancelUser(Number(id));
  }

  @Post('users/:id/reset-password')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async resetUserPassword(@Param('id') id: string) {
    return this.adminService.resetUserPassword(Number(id));
  }

  @Post('tenants/:id/cancel-subscription')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async cancelTenantSubscription(@Param('id') id: string) {
    return this.adminService.cancelTenantSubscription(id);
  }

  @Get('tenants/:id/totals')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getTenantTotals(@Param('id') id: string) {
    return this.adminService.getTenantTotals(id);
  }

  @Post('notifications/send')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async sendNotification(@Body() body: any) {
    this.logger.log(`📨 Recebida solicitação de notificação: target=${body.target}, title=${body.title}`);
    if (!body.title || !body.message) {
      throw new BadRequestException('Título e mensagem são obrigatórios');
    }
    if (body.target === 'specific' && (!body.tenantIds || body.tenantIds.length === 0)) {
      throw new BadRequestException('Para envio específico, informe pelo menos um tenantId');
    }
    return this.adminService.sendNotification(body);
  }

  @Post('notifications/schedule')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async scheduleNotification(@Body() body: any) {
    return this.adminService.scheduleNotification(body);
  }

  @Get('notifications')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getNotifications() {
    return this.adminService.getNotifications();
  }

  @Put('notifications/:id/read')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async markAsRead(@Param('id') id: string) {
    return this.adminService.markAsRead(Number(id));
  }

  @Put('notifications/read-all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async markAllAsRead() {
    return this.adminService.markAllAsRead();
  }

  @Delete('notifications/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('id') id: string) {
    await this.adminService.deleteNotification(Number(id));
  }

  @Get('contact')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllContactMessages(@Query() query: any) {
    return this.adminService.getAllContactMessages(query);
  }

  @Put('contact/:id/reply')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async replyToContactMessage(@Param('id') id: string, @Body() body: { reply: string }) {
    return this.adminService.replyToContactMessage(Number(id), body.reply);
  }

  @Delete('contact/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContactMessage(@Param('id') id: string) {
    await this.adminService.deleteContactMessage(Number(id));
  }

  @Get('admins')
  @Roles('SUPER_ADMIN')
  async getAdmins(@Query() query: any) {
    return this.adminService.getAdmins(query);
  }

  @Get('admins/pending')
  @Roles('SUPER_ADMIN')
  async getPendingAdmins() {
    return this.adminService.getPendingAdmins();
  }

  @Put('admins/:id/block')
  @Roles('SUPER_ADMIN')
  async blockAdmin(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.adminService.blockAdmin(Number(id), user.role);
  }

  @Put('admins/:id/activate')
  @Roles('SUPER_ADMIN')
  async activateAdmin(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.adminService.activateAdmin(Number(id), user.role);
  }

  @Post('admins/:id/reset-password')
  @Roles('SUPER_ADMIN')
  async resetAdminPassword(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.adminService.resetAdminPassword(Number(id), user.role);
  }

  @Delete('admins/:id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAdmin(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.adminService.deleteAdmin(Number(id), user.role);
  }
}