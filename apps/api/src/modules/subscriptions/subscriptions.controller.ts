import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('me')
  async getMySubscription(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getByTenantId(tenantId);
  }

  @Get(':id')
  async getSubscription(@Param('id') id: string) {
    return this.subscriptionsService.getById(id);
  }

  @Get('status')
  async getStatus(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.getSubscriptionStatus(tenantId);
  }

  @Post('checkout')
  async createCheckout(@Request() req) {
    const tenantId = req.user.tenantId;
    const email = req.user.email;
    return this.subscriptionsService.createCheckout(tenantId, email);
  }
}