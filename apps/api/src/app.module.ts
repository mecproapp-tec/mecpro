import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './shared/prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payments/payment.module';
import { WebhookModule } from './webhook/webhook.module';

import { ClientsModule } from './modules/clients/clients.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ContactModule } from './modules/contact/contact.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { QueueModule } from './modules/common/queues/queue.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { PdfModule } from './modules/pdf/pdf.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PublicShareModule } from './modules/public-share/public-share.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    QueueModule, 
    PublicShareModule,
    PrismaModule,
    SharedModule,
    AuthModule,
    PaymentModule,
    WebhookModule,
    ClientsModule,
    EstimatesModule,
    InvoicesModule,
    SubscriptionsModule,
    TenantsModule,
    AdminModule,
    NotificationsModule,
    AppointmentsModule,
    ContactModule,
    WhatsappModule,
    StorageModule,
    UsersModule,
    PdfModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}