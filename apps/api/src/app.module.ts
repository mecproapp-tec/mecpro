import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // ← ADICIONE ESTA IMPORT
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { EstimatesModule } from './modules/estimates/estimates.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { StorageModule } from './modules/storage/storage.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PublicShareModule } from './modules/public-share/public-share.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContactModule } from './modules/contact/contact.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhookModule } from './webhook/webhook.module';
import { WorkerModule } from './work/worker.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ← ESSENCIAL para os jobs com @Cron
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    EstimatesModule,
    InvoicesModule,
    StorageModule,
    PdfModule,
    NotificationsModule,
    AppointmentsModule,
    PublicShareModule,
    TenantsModule,
    UsersModule,
    SubscriptionsModule,
    AdminModule,
    ContactModule,
    DashboardModule,
    WhatsappModule,
    PaymentsModule,
    WebhookModule,
    WorkerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}