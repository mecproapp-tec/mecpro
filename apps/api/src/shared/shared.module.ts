import { Module } from '@nestjs/common';
import { BrowserPoolService } from './browser-pool.service';

@Module({
  providers: [BrowserPoolService],
  exports: [BrowserPoolService],
})
export class SharedModule {}