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
// PRIVADO (autenticado)
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
    return this.estimatesService.findAll(req.user.tenantId, req.user.role);
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

  /**
   * Gera um token de compartilhamento público para o orçamento
   */
  @Post(':id/share')
  async generateShareLink(@Param('id') id: string, @Req() req: AuthRequest) {
    const token = await this.estimatesService.generateShareToken(
      Number(id),
      req.user.tenantId,
      req.user.role,
    );

    const baseUrl = (process.env.API_URL || 'https://api.mecpro.tec.br').replace(/\/$/, '');
    return {
      url: `${baseUrl}/public/estimates/share/${token}`,
    };
  }

  /**
   * (Opcional) Endpoint para testar o upload no R2
   * Descomente se quiser validar a conexão com Cloudflare R2
   */
  // @Get('test-r2')
  // async testR2(@Req() req: AuthRequest) {
  //   const { StorageService } = await import('../storage/storage.service');
  //   const storageService = new StorageService();
  //   const testBuffer = Buffer.from(`Teste R2 - ${new Date().toISOString()}`);
  //   const url = await storageService.uploadPdf(testBuffer, `test/${Date.now()}.pdf`);
  //   return { url };
  // }
}

// ============================
// PÚBLICO (sem autenticação)
// ============================
@Controller('public/estimates')
export class PublicEstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Public()
  @Get('share/:token')
  async getSharedPdf(@Param('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(HttpStatus.BAD_REQUEST).send('Token não fornecido');
    }

    try {
      const result = await this.estimatesService.getPdfByShareToken(token);

      // Se já existe PDF (URL pública do R2)
      if ('pdfUrl' in result && result.pdfUrl) {
        return res.redirect(result.pdfUrl);
      }

      // Se o PDF está sendo gerado agora (fallback)
      return res
        .status(HttpStatus.ACCEPTED)
        .send('Gerando PDF, tente novamente em alguns segundos...');
    } catch (error: any) {
      // Erros específicos de token
      if (
        error?.message === 'Token inválido' ||
        error?.message === 'Token expirado'
      ) {
        return res.status(HttpStatus.NOT_FOUND).send('Link inválido ou expirado');
      }

      // Qualquer outro erro
      console.error('Erro ao acessar PDF público:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Erro ao carregar o PDF');
    }
  }
}