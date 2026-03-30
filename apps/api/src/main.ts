// src/main.ts
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

  // Helmet com configurações adequadas para CORS
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Lista de origens permitidas (pode vir de variável de ambiente)
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  // Origens padrão (inclui admin, www e previews da Vercel)
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

  const origins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

  // Configuração de CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (curl, ferramentas de saúde)
      if (!origin) return callback(null, true);

      // Verifica se a origem está na lista de permitidas
      const isAllowed = origins.some(allowed => {
        // Comparação exata
        if (allowed === origin) return true;
        // Permite subdomínios de domínios principais (ex: admin.mecpro.tec.br)
        if (origin.endsWith(`.${allowed.replace('https://', '')}`)) return true;
        // Permite localhost em qualquer porta
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      // Em produção, rejeita origens não autorizadas
      console.warn(`❌ CORS bloqueado para origem: ${origin}`);
      callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
    optionsSuccessStatus: 200,
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Endpoint de saúde sem prefixo /api para monitoramento
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