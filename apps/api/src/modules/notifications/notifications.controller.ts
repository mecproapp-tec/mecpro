// apps/api/src/modules/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, SessionGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: UserPayload, @Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.notificationsService.findAll(
      user.tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
    return { success: true, data: result.data, total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages };
  }

  @Post()
  async create(@Body() data: { title: string; message: string }, @CurrentUser() user: UserPayload) {
    const notification = await this.notificationsService.create(user.tenantId, data.title, data.message);
    return { success: true, data: notification };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const notification = await this.notificationsService.findOne(Number(id), user.tenantId);
    return { success: true, data: notification };
  }

  @Post(':id/mark-read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const notification = await this.notificationsService.markAsRead(Number(id), user.tenantId);
    return { success: true, data: notification };
  }

  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    await this.notificationsService.markAllAsRead(user.tenantId);
    return { success: true };
  }

  // 🔥 NOVO: excluir uma notificação
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.notificationsService.delete(Number(id), user.tenantId);
    return { success: true, message: 'Notificação excluída com sucesso' };
  }

  // 🔥 NOVO: excluir todas as notificações lidas
  @Delete('read/all')
  @HttpCode(HttpStatus.OK)
  async deleteAllRead(@CurrentUser() user: UserPayload) {
    const result = await this.notificationsService.deleteAllRead(user.tenantId);
    return { success: true, count: result.count, message: `${result.count} notificações lidas excluídas` };
  }
}