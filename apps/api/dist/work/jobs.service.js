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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../shared/prisma/prisma.service");
let JobsService = JobsService_1 = class JobsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(JobsService_1.name);
        this.cronEnabled = process.env.CRON_INSTANCE === 'true';
    }
    async expireTrials() {
        if (!this.cronEnabled)
            return;
        this.logger.log('🔄 Verificando trials expirados...');
        const expiredTenants = await this.prisma.tenant.updateMany({
            where: {
                paymentStatus: 'TRIAL',
                trialEndsAt: { lt: new Date() },
                status: 'ACTIVE',
            },
            data: { status: 'BLOCKED', paymentStatus: 'EXPIRED' },
        });
        if (expiredTenants.count > 0) {
            this.logger.log(`✅ ${expiredTenants.count} tenants tiveram trial expirado`);
        }
    }
    async cleanExpiredSessions() {
        if (!this.cronEnabled)
            return;
        this.logger.log('🔄 Limpando sessões expiradas...');
        const deleted = await this.prisma.userSession.deleteMany({
            where: {
                lastActivity: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
        });
        if (deleted.count > 0) {
            this.logger.log(`✅ ${deleted.count} sessões expiradas removidas`);
        }
    }
    async cleanExpiredTokens() {
        if (!this.cronEnabled)
            return;
        this.logger.log('🔄 Limpando refresh tokens expirados...');
        const deleted = await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        if (deleted.count > 0) {
            this.logger.log(`✅ ${deleted.count} refresh tokens expirados removidos`);
        }
    }
};
exports.JobsService = JobsService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "expireTrials", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "cleanExpiredSessions", null);
__decorate([
    (0, schedule_1.Cron)('0 10 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobsService.prototype, "cleanExpiredTokens", null);
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map