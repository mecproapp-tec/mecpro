import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { AdminGlobalGuard } from '../../common/guards/admin-global.guard';
import { SuperAdminOnlyGuard } from '../../common/guards/super-admin-only.guard';
import { AdminService } from './admin.service';
import { TenantStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, SessionGuard, AdminGlobalGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('tenants')
  async getTenants(@Query() query: any) {
    return this.adminService.getTenants(query);
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenant(id);
  }

  @Put('tenants/:id/status')
  async updateTenantStatus(@Param('id') id: string, @Body('status') status: TenantStatus) {
    return this.adminService.updateTenantStatus(id, status);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTenant(@Param('id') id: string) {
    await this.adminService.deleteTenant(id);
  }

  @Get('financial/summary')
  async getFinancialSummary(@Query() query: any) {
    return this.adminService.getFinancialSummary(query);
  }

  @Get('clients')
  async getAllClients(@Req() req: Request, @Query() query: any) {
    return this.adminService.getAllClients((req as any).user, query);
  }

  @Get('clients/:id')
  async getClientById(@Param('id') id: string) {
    return this.adminService.getClientById(Number(id));
  }

  @Put('clients/:id/block')
  async blockClient(@Param('id') id: string) {
    return this.adminService.blockClient(Number(id));
  }

  @Put('clients/:id/activate')
  async activateClient(@Param('id') id: string) {
    return this.adminService.activateClient(Number(id));
  }

  @Post('clients/:id/send-message')
  async sendMessageToClient(
    @Param('id') id: string,
    @Body() body: { subject: string; message: string }
  ) {
    return this.adminService.sendMessageToClient(Number(id), body);
  }

  @Get('estimates')
  async getAllEstimates(@Req() req: Request, @Query() query: any) {
    return this.adminService.getAllEstimates((req as any).user, query);
  }

  @Get('estimates/:id/pdf')
  async getEstimatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getEstimatePdf(Number(id));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=orcamento-${id}.pdf`,
    });
    res.send(pdfBuffer);
  }

  @Get('invoices')
  async getAllInvoices(@Req() req: Request, @Query() query: any) {
    return this.adminService.getAllInvoices((req as any).user, query);
  }

  @Get('invoices/:id/pdf')
  async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.adminService.getInvoicePdf(Number(id));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=fatura-${id}.pdf`,
    });
    res.send(pdfBuffer);
  }

  @Get('users')
  async getAllUsers(@Query() query: any) {
    return this.adminService.getAllUsers(query);
  }

  @Put('users/:id/block')
  async blockUser(@Param('id') id: string) {
    return this.adminService.blockUser(Number(id));
  }

  @Put('users/:id/activate')
  async activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(Number(id));
  }

  @Post('notifications/send')
  async sendNotification(@Body() body: any) {
    return this.adminService.sendNotification(body);
  }

  @Post('notifications/schedule')
  async scheduleNotification(@Body() body: any) {
    return this.adminService.scheduleNotification(body);
  }

  @Get('notifications')
  async getNotifications() {
    return this.adminService.getNotifications();
  }

  @Put('notifications/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.adminService.markAsRead(Number(id));
  }

  @Put('notifications/read-all')
  async markAllAsRead() {
    return this.adminService.markAllAsRead();
  }

  @Delete('notifications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('id') id: string) {
    await this.adminService.deleteNotification(Number(id));
  }

  @Get('contact')
  async getAllContactMessages(@Query() query: any) {
    return this.adminService.getAllContactMessages(query);
  }

  @Put('contact/:id/reply')
  async replyToContactMessage(
    @Param('id') id: string,
    @Body() body: { reply: string }
  ) {
    return this.adminService.replyToContactMessage(Number(id), body.reply);
  }

  @Delete('contact/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContactMessage(@Param('id') id: string) {
    await this.adminService.deleteContactMessage(Number(id));
  }

  @Get('global-admins')
  @UseGuards(SuperAdminOnlyGuard)
  async listGlobalAdmins() {
    return this.adminService.listGlobalAdmins();
  }

  @Post('global-admins')
  @UseGuards(SuperAdminOnlyGuard)
  async createGlobalAdmin(@Body() body: { email: string; name: string; password: string }) {
    return this.adminService.createGlobalAdmin(body);
  }

  @Delete('global-admins/:id')
  @UseGuards(SuperAdminOnlyGuard)
  async deleteGlobalAdmin(@Param('id') id: number) {
    return this.adminService.deleteGlobalAdmin(id);
  }
}