import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Worker');

  logger.log('🚀 Worker iniciado (NestJS context)');
}

bootstrapWorker().catch(console.error);