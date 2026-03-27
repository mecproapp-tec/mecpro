import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const userRole = user.role;
    return this.clientsService.findAll(tenantId, userRole);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const userRole = user.role;
    return this.clientsService.findOne(+id, tenantId, userRole);
  }

  @Post()
  async create(@Body() createClientDto: any, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    return this.clientsService.create(tenantId, createClientDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const userRole = user.role;
    return this.clientsService.update(+id, tenantId, updateClientDto, userRole);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    const tenantId = user.tenantId;
    const userRole = user.role;
    return this.clientsService.remove(+id, tenantId, userRole);
  }
}