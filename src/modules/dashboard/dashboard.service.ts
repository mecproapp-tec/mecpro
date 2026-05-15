import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // 🔥 CORREÇÃO: Filtrar por tenantId
  async getStats(tenantId: string, userRole: string) {
    // Se for SUPER_ADMIN, pode ver estatísticas globais
    // Caso contrário, vê apenas do seu tenant
    const whereCondition = userRole === 'SUPER_ADMIN' ? {} : { tenantId };

    const [clients, estimates, invoices] = await Promise.all([
      this.prisma.client.count({ where: whereCondition }),
      this.prisma.estimate.count({ where: whereCondition }),
      this.prisma.invoice.count({ where: whereCondition }),
    ]);

    return {
      clients,
      estimates,
      invoices,
      tenantId: userRole === 'SUPER_ADMIN' ? 'all' : tenantId,
    };
  }
}