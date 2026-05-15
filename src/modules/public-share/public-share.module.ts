import { Module } from '@nestjs/common';
import { PublicShareService } from './public-share.service';
import { PublicShareController } from './public-share.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PublicShareService],
  controllers: [PublicShareController],
  exports: [PublicShareService],
})
export class PublicShareModule {}