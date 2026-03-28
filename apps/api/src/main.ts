process.env.TZ = 'America/Sao_Paulo';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
  });

  console.log('🚀 Iniciando aplicação...');
  console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`🔍 PORT env: ${process.env.PORT}`);
  console.log(`🔍 APP_URL env: ${process.env.APP_URL}`);

  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.includes('vercel.app') ||
        origin.includes('mecpro.tec.br') ||
        origin.includes('localhost');

      if (isAllowed) {
        return callback(null, true);
      }

      console.error('❌ CORS bloqueado para origem:', origin);
      return callback(new Error('Not allowed by CORS'));
    },

    credentials: false,

    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],

    optionsSuccessStatus: 200,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  try {
    console.log(`📡 Tentando iniciar servidor em ${host}:${port}`);
    const server = await app.listen(port, host);
    const address = server.address();

    console.log(`✅ Servidor ouvindo em http://${host}:${port}`);
    console.log(`📡 Endereço real: ${JSON.stringify(address)}`);
    console.log(
      `🚀 API rodando em ${
        process.env.APP_URL || `http://localhost:${port}`
      }`,
    );
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();