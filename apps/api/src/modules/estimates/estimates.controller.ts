// src/modules/estimates/estimates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { EstimatesService } from './estimates.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@UseGuards(JwtAuthGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(
    private readonly estimatesService: EstimatesService,
    private readonly pdfService: EstimatesPdfService,
  ) {}

  // Listagem principal (oculta orçamentos convertidos)
  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    if (!user.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.findAll(user.tenantId, parseInt(page), parseInt(limit));
  }

  // Histórico de orçamentos convertidos (apenas leitura, pode excluir)
  @Get('converted')
  async findConverted(
    @CurrentUser() user: UserPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!user) throw new UnauthorizedException('Usuário não autenticado');
    if (!user.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.findConverted(user.tenantId, parseInt(page), parseInt(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.findOne(Number(id), user.tenantId);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @CurrentUser() user: UserPayload, @Res() res: Response) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    const estimate = await this.estimatesService.findOne(Number(id), user.tenantId);
    if (!estimate) throw new BadRequestException('Orçamento não encontrado');
    const pdfBuffer = await this.pdfService.generateEstimatePdf(estimate);
    const filename = `orcamento-${estimate.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdfBuffer);
  }

  @Get(':id/share')
  async getShareLink(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.generateShareLink(Number(id), user.tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEstimateDto, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.create(user.tenantId, createDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEstimateDto,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.update(Number(id), user.tenantId, updateDto);
  }

  // ✅ CORREÇÃO AQUI - Linha 92 corrigida
  @Post(':id/convert')
  async convertToInvoice(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    
    // O service agora retorna um objeto estruturado
    const result = await this.estimatesService.convertToInvoice(Number(id), user.tenantId);
    
    // Retorno compatível com o que seu frontend espera
    return { 
      message: 'Orçamento convertido em fatura com sucesso', 
      invoiceId: result.invoiceId, 
      invoiceNumber: result.invoiceNumber, 
      invoice: result.invoice 
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    await this.estimatesService.remove(Number(id), user.tenantId);
  }

  @Post(':id/send-whatsapp')
  async sendToWhatsApp(
    @Param('id') id: string,
    @Body('phoneNumber') phoneNumber: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    let finalPhone = phoneNumber;
    if (!finalPhone) {
      const estimate = await this.estimatesService.findOne(Number(id), user.tenantId);
      finalPhone = estimate.client?.phone;
      if (!finalPhone) throw new BadRequestException('Cliente sem telefone cadastrado');
    }
    return this.estimatesService.sendToWhatsApp(Number(id), user.tenantId, finalPhone);
  }

  @Post(':id/resend-pdf')
  async resendPdf(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (!user?.tenantId) throw new BadRequestException('TenantId não encontrado');
    return this.estimatesService.resendPdf(Number(id), user.tenantId);
  }
}