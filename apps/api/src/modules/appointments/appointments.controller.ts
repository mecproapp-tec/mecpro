// apps/api/src/modules/appointments/appointments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }
    try {
      return await this.appointmentsService.findAll(
        user.tenantId,
        parseInt(page),
        parseInt(limit),
        startDate,
        endDate,
      );
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar agendamentos');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }
    const appointmentId = this.parseId(id);
    try {
      return await this.appointmentsService.findOne(appointmentId, user.tenantId);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro ao buscar agendamento');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }
    try {
      return await this.appointmentsService.create(user.tenantId, dto);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao criar agendamento');
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }
    const appointmentId = this.parseId(id);
    try {
      return await this.appointmentsService.update(appointmentId, user.tenantId, dto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar agendamento');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) {
      throw new BadRequestException('TenantId não encontrado');
    }
    const appointmentId = this.parseId(id);
    try {
      await this.appointmentsService.remove(appointmentId, user.tenantId);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erro ao deletar agendamento');
    }
  }

  private parseId(id: string): number {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID inválido');
    }
    return numericId;
  }
}