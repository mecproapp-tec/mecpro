import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: { userEmail?: string; userName?: string; message: string; tenantId?: string }) {
    try {
      return await this.prisma.contactMessage.create({
        data: {
          userEmail: data.userEmail,
          userName: data.userName,
          message: data.message,
          tenantId: data.tenantId,
          status: 'pending',
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao criar mensagem: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.contactMessage.findMany({
        select: {
          id: true,
          userEmail: true,
          userName: true,
          message: true,
          status: true,
          reply: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Erro ao listar mensagens: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: { id },
        select: {
          id: true,
          userEmail: true,
          userName: true,
          message: true,
          status: true,
          reply: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
      if (!message) throw new NotFoundException('Mensagem não encontrada');
      return message;
    } catch (error) {
      this.logger.error(`Erro ao buscar mensagem ${id}: ${error.message}`);
      throw error;
    }
  }

  async reply(id: number, reply: string) {
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: { id },
        select: { tenantId: true },
      });
      if (!message) throw new NotFoundException('Mensagem não encontrada');

      this.logger.log(`Respondendo mensagem ${id} - tenantId: ${message.tenantId}`);

      const updatedMessage = await this.prisma.contactMessage.update({
        where: { id },
        data: { reply, status: 'replied' },
        select: {
          id: true,
          userEmail: true,
          userName: true,
          message: true,
          status: true,
          reply: true,
          createdAt: true,
          updatedAt: true,
          tenant: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      if (message.tenantId) {
        try {
          await this.notificationsService.create(
            message.tenantId,
            'Resposta do Administrador',
            reply,
          );
          this.logger.log(`Notificação criada com sucesso para tenant ${message.tenantId}`);
        } catch (notifError) {
          this.logger.error(`Falha ao criar notificação para tenant ${message.tenantId}: ${notifError.message}`);
        }
      } else {
        this.logger.warn(`Mensagem ${id} não possui tenantId, notificação não criada`);
      }

      return updatedMessage;
    } catch (error) {
      this.logger.error(`Erro ao responder mensagem ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const message = await this.prisma.contactMessage.findUnique({ where: { id } });
      if (!message) throw new NotFoundException('Mensagem não encontrada');
      return await this.prisma.contactMessage.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Erro ao excluir mensagem ${id}: ${error.message}`);
      throw error;
    }
  }
}