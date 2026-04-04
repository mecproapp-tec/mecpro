import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

const redisUrl = process.env.REDIS_URL;
@Module({
  imports: [
    BullModule.forRoot({
  connection: {
    url: process.env.REDIS_URL,
  },
}),

    BullModule.registerQueue({
      name: 'pdf',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

