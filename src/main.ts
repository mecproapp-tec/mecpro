// ================= 🔥 CARREGAR .env CORRETO PRIMEIRO =================
import { config } from 'dotenv';
import { resolve } from 'path';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

config({ path: resolve(__dirname, '..', envFile) });

console.log(`📁 Carregando configurações de: ${envFile}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
// ============================================================

process.env.TZ = 'America/Sao_Paulo';

delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { join } from 'path';
import * as express from 'express';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { TenantInterceptor } from './shared/prisma/tenant.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  process.on('unhandledRejection', (reason) => {
    logger.error('❌ Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
  });

  // Verificar variáveis obrigatórias
  const requiredEnv = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = requiredEnv.filter(env => !process.env[env]);
  if (missing.length) {
    logger.error(`❌ Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('⚠️ JWT_SECRET tem menos de 32 caracteres. Recomenda-se uma chave mais forte.');
  }

  logger.log('🚀 Iniciando aplicação...');
  logger.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log(`🔍 PORT env: ${process.env.PORT}`);
  logger.log(`🔍 APP_URL env: ${process.env.APP_URL}`);
  logger.log(`🔍 FRONTEND_URL: ${process.env.FRONTEND_URL}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
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
    'https://unfetching-overslavishly-maxie.ngrok-free.dev',
    'https://*.ngrok-free.dev',
  ];

  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

  logger.log('✅ CORS - Origens permitidas:', allowedOrigins);

  const isOriginAllowed = (origin: string): boolean => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;
    if (origin.includes('localhost')) return true;
    if (origin.match(/^https?:\/\/.*\.mecpro\.tec\.br$/)) return true;
    if (origin.match(/^https?:\/\/.*\.vercel\.app$/)) return true;
    if (origin.match(/^https?:\/\/.*\.ngrok-free\.dev$/)) return true;
    return false;
  };

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        logger.warn(`❌ CORS bloqueado para origem: ${origin}`);
        callback(new Error(`Origem não permitida: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    optionsSuccessStatus: 200,
  });

  // ================= BODY PARSERS =================
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // ================= SECURITY =================
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ================= STATIC FILES =================
  app.use(
    '/api/storage',
    express.static(join(__dirname, '..', 'uploads', 'pdfs')),
  );

  // ================= VALIDATION =================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // ================= INTERCEPTOR TENANT =================
  app.useGlobalInterceptors(new TenantInterceptor());

  app.setGlobalPrefix('api');

  // ================= GUARDS GLOBAIS =================
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ================= ROTAS DE DIAGNÓSTICO =================
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  expressApp.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Endpoint de diagnóstico do banco (protegido ou público? melhor público só para teste)
  expressApp.get('/api/db-check', async (req, res) => {
    try {
      // tenta conectar e contar usuários
      const prisma = app.get('PrismaService'); // precisa expor o PrismaService
      const count = await prisma.user.count();
      res.status(200).json({ success: true, userCount: count });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  try {
    const server = await app.listen(port, host);
    const address = server.address();

    logger.log(`✅ Servidor ouvindo em http://${host}:${port}`);
    logger.log(`📡 Endereço real: ${JSON.stringify(address)}`);
    logger.log(`🚀 API rodando em ${process.env.APP_URL || `http://localhost:${port}`}`);
  } catch (err) {
    logger.error('❌ Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();