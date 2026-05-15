import { Module } from '@nestjs/common';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { AuthModule } from '../../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    WhatsappModule,
  ],
  controllers: [EstimatesController],
  providers: [
    EstimatesService,
    EstimatesPdfService,
  ],
  exports: [EstimatesService, EstimatesPdfService],
})
export class EstimatesModule {}