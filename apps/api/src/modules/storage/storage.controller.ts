// apps/api/src/modules/storage/storage.controller.ts
import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { StorageService } from './storage.service';
import * as path from 'path';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get(':tenantId/:type/:file')
  async getFile(
    @Param('tenantId') tenantId: string,
    @Param('type') type: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    try {
      const key = `${tenantId}/${type}/${file}`;
      const fileBuffer = await this.storageService.getFile(key);

      const ext = path.extname(file).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
      });
      return res.send(fileBuffer);
    } catch (error) {
      throw new NotFoundException('Arquivo não encontrado');
    }
  }
}