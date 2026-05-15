import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { EstimatesModule } from '../estimates/estimates.module';
import { PdfModule } from '../pdf/pdf.module';
import { AuthModule } from '../../auth/auth.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [InvoicesModule, EstimatesModule, PdfModule, AuthModule, MailModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}