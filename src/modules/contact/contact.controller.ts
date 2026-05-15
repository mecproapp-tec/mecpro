// apps/api/src/modules/contact/contact.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/public.decorator';
import { ContactService } from './contact.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // 🔓 ROTA PÚBLICA – qualquer pessoa pode enviar mensagem
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendContact(@Body() data: { userEmail?: string; userName?: string; message: string; tenantId?: string }) {
    // Validações básicas
    if (!data.message || data.message.trim().length === 0) {
      throw new BadRequestException('Mensagem é obrigatória');
    }
    if (!data.userEmail && !data.userName) {
      throw new BadRequestException('Email ou nome do usuário é obrigatório');
    }
    if (data.message.length > 5000) {
      throw new BadRequestException('Mensagem muito longa. Limite de 5000 caracteres.');
    }

    // Salva a mensagem no banco
    const saved = await this.contactService.create({
      userEmail: data.userEmail,
      userName: data.userName,
      message: data.message,
      tenantId: data.tenantId,
    });

    return {
      success: true,
      message: 'Mensagem enviada com sucesso',
      id: saved.id,
      receivedAt: saved.createdAt,
    };
  }

  // 🔒 ROTA ADMIN – lista todas as mensagens (requer autenticação e role ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getContacts(@CurrentUser() user: UserPayload) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Acesso restrito a administradores');
    }
    return this.contactService.findAll();
  }

  // 🔒 ROTA ADMIN – responde uma mensagem
  @UseGuards(JwtAuthGuard)
  @Put(':id/reply')
  async replyToContact(
    @Param('id') id: string,
    @Body() body: { reply: string },
    @CurrentUser() user: UserPayload,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException();
    }
    if (!body.reply || body.reply.trim().length === 0) {
      throw new BadRequestException('Resposta não pode ser vazia');
    }
    return this.contactService.reply(Number(id), body.reply);
  }

  // 🔒 ROTA ADMIN – exclui uma mensagem
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteContact(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException();
    }
    await this.contactService.remove(Number(id));
    return { success: true, message: 'Mensagem excluída' };
  }
}