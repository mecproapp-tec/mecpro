import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}