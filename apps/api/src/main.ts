// apps/api/src/main.ts
process.env.TZ = 'America/Sao_Paulo';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

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

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ================= CORS =================
  const defaultOrigins = [
    'https://www.mecpro.tec.br',
    'https://mecpro.tec.br',
    'https://admin.mecpro.tec.br',
    'https://adminmecpro-auewpg8kk-thiagos-projects-381b904e.vercel.app',
    'https://mec-pro-3qhm-264y7u867-thiagos-projects-381b904e.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001',
    'http://localhost:8080',
  ];

  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  console.log('✅ CORS - Origens permitidas:', allowedOrigins);

  const isOriginAllowed = (origin: string): boolean => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
    if (origin.match(/^https?:\/\/.*\.mecpro\.tec\.br$/)) return true;
    if (origin.match(/^https?:\/\/.*\.vercel\.app$/)) return true;
    return false;
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS bloqueado para origem: ${origin}`);
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    optionsSuccessStatus: 200,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // 🔥 HEALTH CHECK – registrado ANTES do prefixo global
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 🔥 PREFIXO GLOBAL (apenas para rotas da API)
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  try {
    console.log(`📡 Tentando iniciar servidor em ${host}:${port}`);
    const server = await app.listen(port, host);
    const address = server.address();

    console.log(`✅ Servidor ouvindo em http://${host}:${port}`);
    console.log(`📡 Endereço real: ${JSON.stringify(address)}`);
    console.log(
      `🚀 API rodando em ${process.env.APP_URL || `http://localhost:${port}`}`,
    );
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();