import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
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
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  // 🔥 LISTAR TODAS
  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    const notifications = await this.notificationsService.findAll(
      user.tenantId,
    );

    return {
      success: true,
      data: notifications,
    };
  }

  // 🔥 CRIAR
  @Post()
  async create(
    @Body() data: { title: string; message: string },
    @CurrentUser() user: UserPayload,
  ) {
    const notification = await this.notificationsService.create(
      user.tenantId,
      data.title,
      data.message,
    );

    return {
      success: true,
      data: notification,
    };
  }

  // 🔥 BUSCAR UMA
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const notifications = await this.notificationsService.findAll(
      user.tenantId,
    );

    const notification = notifications.find(
      (n) => n.id === Number(id),
    );

    return {
      success: true,
      data: notification || null,
    };
  }

  // 🔥 MARCAR COMO LIDA
  @Post(':id/mark-read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const notification = await this.notificationsService.markAsRead(
      Number(id),
      user.tenantId,
    );

    return {
      success: true,
      data: notification,
    };
  }

  // 🔥 MARCAR TODAS COMO LIDAS (extra - recomendo usar)
  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    await this.notificationsService.markAllAsRead(user.tenantId);

    return {
      success: true,
    };
  }
}