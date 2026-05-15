// apps/api/src/worker.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '.././app.module';
import { Logger } from '@nestjs/common';

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');

  logger.log('🚀 Worker iniciado');
  logger.log('⏰ Jobs agendados ativos:');
  logger.log('   - Expiração de trials (diário)');
  logger.log('   - Limpeza de sessões (hora)');
  logger.log('   - Lembretes de pagamento (diário)');

  // Mantém o worker rodando
  process.on('SIGTERM', async () => {
    logger.log('🛑 Recebido SIGTERM, fechando worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrapWorker().catch((err) => {
  console.error('❌ Erro no worker:', err);
  process.exit(1);
});