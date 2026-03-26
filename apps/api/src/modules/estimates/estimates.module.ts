import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EstimatesService } from './estimates.service';
import { EstimatesController, PublicEstimatesController } from './estimates.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { EstimatesPdfService } from './estimates-pdf.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { StorageModule } from '../storage/storage.module';
import { EstimatePdfProcessor } from './estimate-pdf.processor';

@Module({
  imports: [
    PrismaModule,
    WhatsappModule,
    StorageModule,
    BullModule.registerQueue({ name: 'pdf-estimate' }),
  ],
  controllers: [EstimatesController, PublicEstimatesController],
  providers: [EstimatesService, EstimatesPdfService, EstimatePdfProcessor],
})
export class EstimatesModule {}