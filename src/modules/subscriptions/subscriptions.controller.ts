// apps/api/src/modules/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  async getMySubscription(@CurrentUser() user: UserPayload) {
    return this.subscriptionsService.getSubscriptionStatus(user.tenantId);
  }

  @Post('create-checkout')
  async createCheckout(@CurrentUser() user: UserPayload, @Body('email') email: string) {
    return this.subscriptionsService.createCheckout(user.tenantId, email);
  }

  @Post('cancel')
  async cancelSubscription(@CurrentUser() user: UserPayload) {
    return this.subscriptionsService.cancelSubscription(user.tenantId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async findAllSubscriptions(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const subscriptions = await this.subscriptionsService.findAllSubscriptions(
      parseInt(page),
      parseInt(limit),
    );
    
    return {
      success: true,
      data: subscriptions.data,
      total: subscriptions.total,
      page: subscriptions.page,
      limit: subscriptions.limit,
      totalPages: subscriptions.totalPages,
    };
  }
}