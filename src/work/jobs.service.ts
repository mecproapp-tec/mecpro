import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private prisma: PrismaService) {}

  // ⏰ Executa todo dia à meia-noite - EXPIRAR TRIALS
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireTrials() {
    this.logger.log('🔄 Verificando trials expirados...');
    
    const expiredTenants = await this.prisma.tenant.updateMany({
      where: {
        paymentStatus: 'TRIAL',
        trialEndsAt: { lt: new Date() },
        status: 'ACTIVE',
      },
      data: {
        status: 'BLOCKED',
        paymentStatus: 'EXPIRED',
      },
    });

    if (expiredTenants.count > 0) {
      this.logger.log(`✅ ${expiredTenants.count} tenants tiveram trial expirado`);
    }
  }

  // ⏰ Executa a cada hora - LIMPAR SESSÕES EXPIRADAS
  @Cron(CronExpression.EVERY_HOUR)
  async cleanExpiredSessions() {
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

  // ⏰ Executa todo dia às 10h - LIMPAR TOKENS EXPIRADOS
  @Cron('0 10 * * *')
  async cleanExpiredTokens() {
    this.logger.log('🔄 Limpando refresh tokens expirados...');
    
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (deleted.count > 0) {
      this.logger.log(`✅ ${deleted.count} refresh tokens expirados removidos`);
    }
  }
}