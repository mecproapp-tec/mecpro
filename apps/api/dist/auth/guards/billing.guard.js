"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
let BillingGuard = class BillingGuard {
    constructor(prisma) {
        this.prisma = prisma;
        this.cache = new Map();
        this.CACHE_TTL = 30000;
    }
    getCachedTenant(tenantId) {
        const cached = this.cache.get(tenantId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        return null;
    }
    setCachedTenant(tenantId, data) {
        this.cache.set(tenantId, {
            data,
            expiresAt: Date.now() + this.CACHE_TTL,
        });
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não autenticado');
        }
        if (!user.tenantId) {
            throw new common_1.UnauthorizedException('Tenant não encontrado no token');
        }
        if (user.role === 'SUPER_ADMIN') {
            return true;
        }
        let tenant = this.getCachedTenant(user.tenantId);
        if (!tenant) {
            tenant = await this.prisma.tenant.findUnique({
                where: { id: user.tenantId },
            });
            if (tenant) {
                this.setCachedTenant(user.tenantId, tenant);
            }
        }
        if (!tenant) {
            throw new common_1.UnauthorizedException('Tenant não encontrado no sistema');
        }
        if (tenant.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Sua conta está inativa. Entre em contato com o suporte.');
        }
        const allowedPaymentStatuses = ['PAID', 'TRIAL'];
        if (!allowedPaymentStatuses.includes(tenant.paymentStatus ?? '')) {
            throw new common_1.ForbiddenException('Pagamento pendente. Acesse o link de pagamento para regularizar sua assinatura.');
        }
        if (tenant.paymentStatus === 'TRIAL' &&
            tenant.trialEndsAt) {
            const trialEndUTC = new Date(tenant.trialEndsAt);
            const nowUTC = new Date();
            if (nowUTC.getTime() > trialEndUTC.getTime()) {
                throw new common_1.ForbiddenException('Seu período de teste expirou. Faça o upgrade para continuar usando o sistema.');
            }
        }
        return true;
    }
};
exports.BillingGuard = BillingGuard;
exports.BillingGuard = BillingGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingGuard);
//# sourceMappingURL=billing.guard.js.map