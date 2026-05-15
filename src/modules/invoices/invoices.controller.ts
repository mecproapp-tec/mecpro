// src/modules/invoices/invoices.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch, // ✅ ADICIONADO
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    if (!user.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.findAll(user.tenantId, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.findOne(Number(id), user.tenantId);
  }

  @Get(':id/share')
  async getShareLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.generateShareLink(Number(id), user.tenantId);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.OK)
  async createShareLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.generateShareLink(Number(id), user.tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateInvoiceDto, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.create(user.tenantId, createDto);
  }

  // ✅ PUT (mantido)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.update(Number(id), user.tenantId, updateDto);
  }

  // ✅ PATCH (NOVO - resolve seu erro 404)
  @Patch(':id')
  async updatePartial(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.update(Number(id), user.tenantId, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    await this.invoicesService.remove(Number(id), user.tenantId);
  }

  @Post(':id/send-whatsapp')
  @HttpCode(HttpStatus.OK)
  async sendToWhatsApp(
    @Param('id') id: string,
    @Body('phoneNumber') phoneNumber: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');

    let finalPhone = phoneNumber;

    if (!finalPhone || finalPhone.trim() === '') {
      const invoice = await this.invoicesService.findOne(Number(id), user.tenantId);
      finalPhone = invoice.client?.phone;

      if (!finalPhone) {
        throw new BadRequestException('Cliente sem telefone cadastrado');
      }
    }

    return this.invoicesService.sendToWhatsApp(Number(id), user.tenantId, finalPhone);
  }

  @Post(':id/resend-pdf')
  async resendPdf(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.invoicesService.resendPdf(Number(id), user.tenantId);
  }
}