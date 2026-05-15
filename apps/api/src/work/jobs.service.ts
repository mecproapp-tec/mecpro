// apps/api/src/work/jobs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly cronEnabled = process.env.CRON_INSTANCE === 'true';

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireTrials() {
    if (!this.cronEnabled) return;
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

  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredSessions() {
    if (!this.cronEnabled) return;
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

  @Cron('0 10 * * *')
  async cleanExpiredTokens() {
    if (!this.cronEnabled) return;
    this.logger.log('🔄 Limpando refresh tokens expirados...');
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (deleted.count > 0) {
      this.logger.log(`✅ ${deleted.count} refresh tokens expirados removidos`);
    }
  }
}