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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../shared/prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const jwt_1 = require("@nestjs/jwt");
const payment_service_1 = require("../payments/payment.service");
const crypto_1 = require("crypto");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, paymentService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.paymentService = paymentService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async signup(data) {
        const hashed = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashed,
                tenantId: data.tenantId,
                status: 'ACTIVE',
            },
        });
        return user;
    }
    async registerTenant(data) {
        const existingUser = await this.prisma.user.findFirst({
            where: { email: data.email },
        });
        if (existingUser)
            throw new common_1.BadRequestException('Email já cadastrado');
        const existingTenant = await this.prisma.tenant.findFirst({
            where: { documentNumber: data.documentNumber },
        });
        if (existingTenant)
            throw new common_1.BadRequestException('Documento já cadastrado');
        if (!data.preapprovalId) {
            throw new common_1.BadRequestException('ID da assinatura não fornecido.');
        }
        const subscriptionData = await this.paymentService.getSubscription(data.preapprovalId);
        if (subscriptionData.status !== 'authorized') {
            throw new common_1.BadRequestException('Assinatura não autorizada ou pendente.');
        }
        const trialEndsAt = new Date(subscriptionData.next_payment_date);
        const tenant = await this.prisma.tenant.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                name: data.officeName,
                documentType: data.documentType,
                documentNumber: data.documentNumber,
                cep: data.cep,
                address: data.address,
                email: data.email,
                phone: data.phone,
                status: 'ACTIVE',
                trialEndsAt,
                subscriptionId: data.preapprovalId,
                paymentStatus: 'TRIAL',
            },
        });
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: data.ownerName,
                email: data.email,
                password: hashedPassword,
                role: 'OWNER',
                tenantId: tenant.id,
                status: 'ACTIVE',
            },
        });
        const sessionToken = this.generateSessionToken();
        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                sessionToken,
                ipAddress: '',
                userAgent: 'system',
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            sessionToken,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshTokenPlain = this.generateRefreshToken();
        const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
        await this.prisma.refreshToken.create({
            data: {
                tokenHash: refreshTokenHash,
                userId: user.id,
                sessionToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            message: 'Cadastro realizado com sucesso',
            accessToken,
            refreshToken: refreshTokenPlain,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                officeName: tenant.name,
            },
        };
    }
    async registerAdmin(data) {
        const existingUser = await this.prisma.user.findFirst({
            where: { email: data.email },
        });
        if (existingUser)
            throw new common_1.BadRequestException('Email já cadastrado');
        const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000001';
        let tenant = await this.prisma.tenant.findUnique({
            where: { id: ADMIN_TENANT_ID },
        });
        if (!tenant) {
            tenant = await this.prisma.tenant.create({
                data: {
                    id: ADMIN_TENANT_ID,
                    name: 'Administração',
                    documentType: 'ADMIN',
                    documentNumber: '00000000000000',
                    cep: '00000000',
                    address: 'Sistema',
                    email: 'admin@mecpro.com',
                    phone: '0000000000',
                    status: 'ACTIVE',
                },
            });
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                tenantId: tenant.id,
                status: 'ACTIVE',
            },
        });
        return {
            message: 'Administrador cadastrado com sucesso',
            user,
        };
    }
    async login(email, password, req) {
        const user = await this.prisma.user.findFirst({
            where: { email },
            include: { tenant: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        if (!user.tenantId)
            throw new common_1.UnauthorizedException('Usuário sem tenant');
        if (user.status === 'BLOCKED') {
            throw new common_1.UnauthorizedException('Usuário bloqueado. Contate o suporte.');
        }
        if (!user.tenant || user.tenant.status !== 'ACTIVE') {
            this.logger.warn(`Tentativa de login para tenant bloqueado/cancelado: ${email}`);
            throw new common_1.UnauthorizedException('Sua conta da oficina foi bloqueada ou cancelada. Entre em contato com o suporte.');
        }
        await this.prisma.userSession.deleteMany({
            where: { userId: user.id },
        });
        const sessionToken = this.generateSessionToken();
        await this.prisma.userSession.create({
            data: {
                userId: user.id,
                sessionToken,
                ipAddress: req.ip || '',
                userAgent: req.headers['user-agent'] || '',
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            sessionToken,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshTokenPlain = this.generateRefreshToken();
        const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
        await this.prisma.refreshToken.deleteMany({
            where: { userId: user.id },
        });
        await this.prisma.refreshToken.create({
            data: {
                tokenHash: refreshTokenHash,
                userId: user.id,
                sessionToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return {
            accessToken,
            refreshToken: refreshTokenPlain,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                officeName: user.tenant?.name || null,
                role: user.role,
            },
        };
    }
    async logout(userId, sessionToken) {
        await this.prisma.userSession.deleteMany({
            where: { userId, sessionToken },
        });
        await this.prisma.refreshToken.deleteMany({
            where: { userId, sessionToken },
        });
        return { message: 'Logout realizado com sucesso' };
    }
    async refreshToken(refreshTokenPlain, sessionToken) {
        if (!sessionToken) {
            throw new common_1.UnauthorizedException('Session token não fornecido');
        }
        const stored = await this.prisma.refreshToken.findFirst({
            where: { sessionToken },
            include: { user: { include: { tenant: true } } },
        });
        if (!stored)
            throw new common_1.UnauthorizedException('Refresh token inválido');
        const isValid = await bcrypt.compare(refreshTokenPlain, stored.tokenHash);
        if (!isValid)
            throw new common_1.UnauthorizedException('Refresh token inválido');
        const user = stored.user;
        const session = await this.prisma.userSession.findFirst({
            where: { userId: user.id, sessionToken },
        });
        if (!session)
            throw new common_1.UnauthorizedException('Sessão não encontrada');
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Usuário bloqueado');
        }
        if (!user.tenant || user.tenant.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Sua conta da oficina foi bloqueada ou cancelada');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            sessionToken,
        };
        const accessToken = this.jwtService.sign(payload);
        return { accessToken };
    }
    generateRefreshToken() {
        return (0, crypto_1.randomBytes)(64).toString('hex');
    }
    generateSessionToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                status: true,
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        status: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            status: user.status,
            officeName: user.tenant?.name || null,
            logoUrl: user.tenant?.logoUrl || null,
            tenantStatus: user.tenant?.status || null,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        payment_service_1.PaymentService])
], AuthService);
//# sourceMappingURL=auth.service.js.map