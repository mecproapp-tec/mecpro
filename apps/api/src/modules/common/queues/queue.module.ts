import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('QueueModule');

        // 1. Tenta obter a URL completa (REDIS_URL) – é a mais confiável
        let redisUrl = configService.get('REDIS_URL');
        let host = configService.get('REDIS_HOST');
        let port = configService.get('REDIS_PORT');
        let password = configService.get('REDIS_PASSWORD');

        if (redisUrl) {
          try {
            const parsed = new URL(redisUrl);
            host = parsed.hostname;
            port = parseInt(parsed.port, 10);
            password = parsed.password;
            logger.log(`REDIS_URL encontrada: ${host}:${port}`);
          } catch (e) {
            logger.error('REDIS_URL inválida', e);
          }
        }

        // 2. Se ainda não temos host/port, desistimos e usamos uma conexão dummy que não trava
        if (!host || !port) {
          logger.warn('Redis não configurado. As filas não serão usadas.');
          return {
            connection: {
              host: 'localhost',
              port: 6379,
              connectTimeout: 1000,
              retryStrategy: () => null, // nunca tenta reconectar
            },
          };
        }

        // 3. Configuração real com tentativa única e timeout curto
        logger.log(`Redis configurado com host=${host}, port=${port}`);

        return {
          connection: {
            host,
            port: Number(port),
            password,
            connectTimeout: 3000,        // 3 segundos para timeout
            retryStrategy: () => null,   // desativa re-tentativas infinitas
          },
          defaultJobOptions: {
            attempts: 1,                 // sem re-tentativas no job
            removeOnComplete: true,
            removeOnFail: true,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}