// src/modules/storage/storage.controller.ts
import { Controller, Get, Param, Res, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/public.decorator';
import * as path from 'path';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Get('share/:token/:filename')
  async getSharedFile(@Param('token') token: string, @Param('filename') filename: string, @Res() res: Response) {
    const share = await this.storageService.validateShareToken(token);
    if (!share) {
      throw new NotFoundException('Link inválido ou expirado');
    }
    return this.serveFile(filename, res);
  }

  @Get('*')
  async getFile(@Param('0') filePath: string, @Res() res: Response, @Req() req: Request) {
    const sanitizedPath = this.sanitizeFilePath(filePath);
    const user = (req as any).user;
    if (!user || !user.tenantId) {
      throw new NotFoundException('Acesso não autorizado');
    }
    if (!sanitizedPath.includes(user.tenantId)) {
      console.error(`❌ Tentativa de acesso a arquivo de outro tenant: ${sanitizedPath} por user ${user.id}`);
      throw new NotFoundException('Acesso negado');
    }
    return this.serveFile(sanitizedPath, res);
  }

  private async serveFile(filePath: string, res: Response) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
      
      if (!allowedExtensions.includes(ext)) {
        throw new NotFoundException('Tipo de arquivo não permitido');
      }
      
      const fileBuffer = await this.storageService.getFile(filePath);
      
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      });
      
      return res.send(fileBuffer);
    } catch (error) {
      console.error(`❌ Erro ao servir arquivo ${filePath}:`, error.message);
      throw new NotFoundException('Arquivo não encontrado');
    }
  }

  private sanitizeFilePath(filePath: string): string {
    let normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    normalized = normalized.replace(/[;&|`$]/g, '');
    const parts = normalized.split(/[\/\\]/);
    const safeParts = parts.filter(part => part !== '..' && part !== '.');
    return safeParts.join('/');
  }
}