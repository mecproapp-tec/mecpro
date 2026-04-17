// apps/api/src/main.ts
process.env.TZ = 'America/Sao_Paulo';

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
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

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Middleware para OPTIONS (preflight)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ================= CORS =================
  const defaultOrigins = [
    'https://www.mecpro.tec.br',
    'https://mecpro.tec.br',
    'https://admin.mecpro.tec.br',
    'https://api.mecpro.tec.br',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
  ];

  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];
  console.log('✅ CORS - Origens permitidas:', allowedOrigins);

  const isOriginAllowed = (origin: string): boolean => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (origin.includes('localhost')) return true;
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
        callback(new Error(`Origem não permitida: ${origin}`));
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
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  // ================= HEALTH CHECK =================
  // Obtém a instância do Express para definir a rota raw
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
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
      `🚀 API rodando em ${process.env.APP_URL || `http://localhost:${port}`}`,
    );
  } catch (err) {
    console.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();