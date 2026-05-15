import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EmailModule } from '../shared/email/email.module';

@Module({
  imports: [PaymentsModule, EmailModule],
  controllers: [WebhookController],
  providers: [PrismaService],
})
export class WebhookModule {}