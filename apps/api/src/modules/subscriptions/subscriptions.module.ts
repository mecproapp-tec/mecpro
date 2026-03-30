import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PaymentModule } from '../../payments/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}