import { Controller, Get, Put, Body, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TenantsService } from './tenants.service';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('tenants')
@UseGuards(JwtAuthGuard, SessionGuard)
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  async getMyTenant(@CurrentUser() user: UserPayload) {
    const tenant = await this.tenantsService.getById(user.tenantId);
    this.logger.log(`GET /me - complement = "${tenant.complement}"`);
    return {
      success: true,
      data: {
        nome: tenant.name,
        tipoDocumento: tenant.documentType,
        documento: tenant.documentNumber,
        endereco: tenant.address,
        numero: tenant.number || '',
        complemento: tenant.complement || '',
        telefone: tenant.phone,
        email: tenant.email,
        logo: tenant.logoUrl,
      },
    };
  }

  @Put('me')
  async updateMyTenant(@Body() data: any, @CurrentUser() user: UserPayload) {
    this.logger.log(`PUT /me - recebido complemento = "${data.complemento}"`);
    if (!data.nome && !data.documento && !data.email && !data.telefone && !data.endereco && !data.numero && !data.logo) {
      throw new BadRequestException('Nenhum dado para atualizar');
    }
    const updated = await this.tenantsService.update(user.tenantId, data);
    this.logger.log(`PUT /me - após update, complement = "${updated.complement}"`);
    return {
      success: true,
      message: 'Dados da oficina atualizados com sucesso',
      data: {
        nome: updated.name,
        tipoDocumento: updated.documentType,
        documento: updated.documentNumber,
        endereco: updated.address,
        numero: updated.number || '',
        complemento: updated.complement || '',
        telefone: updated.phone,
        email: updated.email,
        logo: updated.logoUrl,
      },
    };
  }
}