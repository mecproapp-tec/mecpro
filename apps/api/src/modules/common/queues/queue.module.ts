import { Module, Logger, OnApplicationShutdown } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('QueueModule');
        const host = configService.get('REDIS_HOST');
        const port = configService.get('REDIS_PORT');
        const password = configService.get('REDIS_PASSWORD');

        if (!host || !port) {
          logger.warn('Redis não configurado. As filas não funcionarão.');
          return {
            connection: {
              host: 'localhost',
              port: 6379,
              connectTimeout: 1000,
              retryStrategy: () => null, // não tenta reconectar
            },
          };
        }

        return {
          connection: {
            host,
            port: Number(port),
            password,
            connectTimeout: 5000,
            retryStrategy: (times) => {
              if (times > 3) return null;
              return Math.min(times * 100, 3000);
            },
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}