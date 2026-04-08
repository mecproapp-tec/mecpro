import { Controller, Get, Patch, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { StorageService } from '../storage/storage.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(
    private tenantsService: TenantsService,
    private storageService: StorageService,
  ) {}

  @Get('me')
  async getMyTenant(@Request() req) {
    return this.tenantsService.getById(req.user.tenantId);
  }

  @Patch('me')
  async updateMyTenant(@Request() req, @Body() updateData: any) {
    // Remove qualquer campo de imagem que possa vir (prevenção)
    const { logo, ...cleanData } = updateData;
    return this.tenantsService.update(req.user.tenantId, cleanData);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Formato não suportado. Use JPG, PNG ou WEBP.'), false);
      }
      cb(null, true);
    },
  }))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const tenantId = req.user.tenantId;
    const key = `${tenantId}/logo/${Date.now()}-${file.originalname}`;
    const logoUrl = await this.storageService.uploadPdf(file.buffer, key);
    await this.tenantsService.update(tenantId, { logoUrl });
    return { logoUrl };
  }
}