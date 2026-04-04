import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { EstimatesService } from './estimates.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { Public } from '../../auth/public.decorator';
import { Request, Response } from 'express';

// ============================
// TIPOS
// ============================
interface AuthRequest extends Request {
  user: {
    tenantId: string;
    role: string;
  };
}

interface CreateEstimateDto {
  clientId: number;
  date: string;
  items: any[];
}

interface UpdateEstimateDto extends CreateEstimateDto {
  status?: string;
}

// ============================
// PRIVADO
// ============================
@Controller('estimates')
@UseGuards(JwtAuthGuard)
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Post()
  create(@Body() data: CreateEstimateDto, @Req() req: AuthRequest) {
    return this.estimatesService.create(req.user.tenantId, data);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.estimatesService.findAll(
      req.user.tenantId,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.estimatesService.findOne(
      Number(id),
      req.user.tenantId,
      req.user.role,
    );
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateEstimateDto,
    @Req() req: AuthRequest,
  ) {
    return this.estimatesService.update(
      Number(id),
      req.user.tenantId,
      data,
      req.user.role,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.estimatesService.remove(
      Number(id),
      req.user.tenantId,
      req.user.role,
    );
  }

  @Post(':id/share')
  async generateShareLink(@Param('id') id: string, @Req() req: AuthRequest) {
    const token = await this.estimatesService.generateShareToken(
      Number(id),
      req.user.tenantId,
      req.user.role,
    );

    const baseUrl = process.env.API_URL || 'https://api.mecpro.tec.br/api';

return {
  url: `${baseUrl}/public/invoices/share/${token}`,
};

    return {
      url: `${baseUrl}/api/public/estimates/share/${token}`,
    };
  }
}

// ============================
// PUBLICO
// ============================
@Controller('public/estimates')
export class PublicEstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Public()
  @Get('share/:token')
  async getSharedPdf(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(400).send('Token não fornecido');
    }

    try {
      const result = await this.estimatesService.getPdfByShareToken(token);

   if ('pdfUrl' in result) {
  return res.redirect(result.pdfUrl);
}

if ('pdfBuffer' in result) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'inline; filename=orcamento.pdf',
  );
  return res.send(result.pdfBuffer);
}

if ('generating' in result) {
  return res
    .status(202)
    .send('Gerando PDF, tente novamente...');
}

      return res
        .status(202)
        .send('Gerando PDF, tente novamente...');
    } catch (error: any) {
      if (
        error?.message === 'Token inválido' ||
        error?.message === 'Token expirado'
      ) {
        return res.status(404).send('Link inválido');
      }

      return res.status(500).send('Erro ao gerar PDF');
    }
  }
}