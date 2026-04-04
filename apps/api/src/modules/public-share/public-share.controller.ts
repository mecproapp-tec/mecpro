import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PublicShareService } from './public-share.service';

@Controller('public')
export class PublicShareController {
  constructor(private service: PublicShareService) {}

  @Get('share/:token')
  async get(@Param('token') token: string) {
    const share = await this.service.findByToken(token);

    if (!share) {
      throw new NotFoundException('Link inválido');
    }

    return {
      pdfUrl: share.pdfUrl,
      type: share.type,
    };
  }
}