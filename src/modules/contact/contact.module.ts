// apps/api/src/modules/contact/contact.module.ts
import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { AuthModule } from '../../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../shared/prisma/prisma.module'; // ← adicione esta linha

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    PrismaModule, // ← necessário para o PrismaService
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}