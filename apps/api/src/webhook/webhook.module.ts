import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaService } from '../shared/prisma/prisma.service';
import { MailModule } from '../modules/mail/mail.module';

@Module({
  imports: [PaymentsModule, MailModule],
  controllers: [WebhookController],
  providers: [PrismaService],
})
export class WebhookModule {}