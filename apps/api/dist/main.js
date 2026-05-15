"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, '..', envFile) });
console.log(`📁 Carregando configurações de: ${envFile}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
process.env.TZ = 'America/Sao_Paulo';
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const express_1 = require("express");
const path_2 = require("path");
const express = __importStar(require("express"));
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const core_2 = require("@nestjs/core");
const tenant_interceptor_1 = require("./shared/prisma/tenant.interceptor");
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
    console.log(`🔍 FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
    console.log('✅ CORS - Origens permitidas:', allowedOrigins);
    const isOriginAllowed = (origin) => {
        if (!origin)
            return true;
        if (allowedOrigins.includes(origin))
            return true;
        if (origin.includes('localhost'))
            return true;
        if (origin.match(/^https?:\/\/.*\.mecpro\.tec\.br$/))
            return true;
        if (origin.match(/^https?:\/\/.*\.vercel\.app$/))
            return true;
        if (origin.match(/^https?:\/\/.*\.ngrok-free\.dev$/))
            return true;
        return false;
    };
    app.enableCors({
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
            }
            else {
                console.warn(`❌ CORS bloqueado para origem: ${origin}`);
                callback(new Error(`Origem não permitida: ${origin}`));
            }
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
        optionsSuccessStatus: 200,
    });
    app.use((0, express_1.json)({ limit: '10mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '10mb' }));
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    app.use('/api/storage', express.static((0, path_2.join)(__dirname, '..', 'uploads', 'pdfs')));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalInterceptors(new tenant_interceptor_1.TenantInterceptor());
    app.setGlobalPrefix('api');
    const reflector = app.get(core_2.Reflector);
    app.useGlobalGuards(new jwt_auth_guard_1.JwtAuthGuard(reflector));
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
    const port = process.env.PORT || 3000;
    const host = '0.0.0.0';
    try {
        console.log(`📡 Tentando iniciar servidor em ${host}:${port}`);
        const server = await app.listen(port, host);
        const address = server.address();
        console.log(`✅ Servidor ouvindo em http://${host}:${port}`);
        console.log(`📡 Endereço real: ${JSON.stringify(address)}`);
        console.log(`🚀 API rodando em ${process.env.APP_URL || `http://localhost:${port}`}`);
    }
    catch (err) {
        console.error('❌ Falha ao iniciar servidor:', err);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map