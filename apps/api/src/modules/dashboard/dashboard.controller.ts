import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)  // ✅ ADICIONADO: Protege o endpoint
export class DashboardController {

  constructor(private dashboardService: DashboardService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'SUPER_ADMIN')  // ✅ ADICIONADO: Apenas usuários autenticados com papel apropriado
  async getDashboard(@CurrentUser() user: UserPayload) {
    // ✅ ADICIONADO: Log para auditoria
    console.log(`📊 Dashboard acessado por usuário ${user.id} (tenant: ${user.tenantId}, role: ${user.role})`);
    
    // ✅ ADICIONADO: Passa o tenantId para o service filtrar os dados
    return this.dashboardService.getStats(user.tenantId, user.role);
  }
}