import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SessionGuard } from '../../auth/guards/session.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@UseGuards(JwtAuthGuard, SessionGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!user.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }

    return this.clientsService.findAll(
      user.tenantId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }

    const clientId = this.parseId(id);
    return this.clientsService.findOne(clientId, user.tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateClientDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }

    return this.clientsService.create(user.tenantId, createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateClientDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }

    const clientId = this.parseId(id);

    return this.clientsService.update(
      clientId,
      user.tenantId,
      updateDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }

    const clientId = this.parseId(id);

    await this.clientsService.remove(clientId, user.tenantId);
  }

  private parseId(id: string): number {
    const numericId = Number(id);

    if (isNaN(numericId)) {
      throw new BadRequestException('ID inválido');
    }

    return numericId;
  }
}