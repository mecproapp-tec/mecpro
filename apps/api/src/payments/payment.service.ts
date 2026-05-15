import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private client: MercadoPagoConfig;
  private preApproval: PreApproval;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.error('❌ Mercado Pago Access Token não configurado');
      throw new Error('Mercado Pago Access Token não configurado');
    }

    this.client = new MercadoPagoConfig({ accessToken });
    this.preApproval = new PreApproval(this.client);

    this.logger.log('✅ Mercado Pago inicializado com sucesso');
  }

  async createSubscription(params: {
    email: string;
    externalReference: string;
    backUrl: string;
  }): Promise<{ checkoutLink: string; preapprovalId: string }> {
    try {
      this.logger.log(`🔵 Criando assinatura REAL para ${params.email}`);

      if (!params.email) {
        throw new BadRequestException('Email é obrigatório');
      }

      console.log('📦 PARAMS RECEBIDOS:', JSON.stringify(params, null, 2));

      // Removido 'free_trial' por incompatibilidade de tipos no SDK
      const response = await this.preApproval.create({
        body: {
          reason: 'Plano MecPro - Oficina Mecânica',
          external_reference: params.externalReference,
          payer_email: params.email,
          back_url: params.backUrl,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 149.9,
            currency_id: 'BRL',
          },
          status: 'pending',
        },
      });

      console.log('🔥 RESPOSTA COMPLETA MP:', JSON.stringify(response, null, 2));

      const preapprovalId = response.id;
      // Usa apenas init_point (o SDK já retorna o link correto conforme ambiente)
      const checkoutLink = response.init_point;

      if (!checkoutLink) {
        this.logger.error('❌ Mercado Pago não retornou checkoutLink');
        console.log('🔥 RESPONSE MP:', response);
        throw new BadRequestException('Mercado Pago não retornou checkoutLink');
      }

      this.logger.log(`✅ Assinatura criada com sucesso: ${preapprovalId}`);
      this.logger.log(`🔗 Checkout Link: ${checkoutLink}`);

      return { checkoutLink, preapprovalId };
    } catch (error: any) {
      this.logger.error(`❌ Erro ao criar assinatura Mercado Pago`, error);
      console.log('🔥 ERRO COMPLETO MP:', JSON.stringify(error, null, 2));
      throw new BadRequestException(error?.message || 'Falha ao criar assinatura no Mercado Pago');
    }
  }

  async getSubscription(preapprovalId: string): Promise<any> {
    try {
      this.logger.log(`🔎 Consultando assinatura: ${preapprovalId}`);
      const response = await this.preApproval.get({ id: preapprovalId });
      console.log('📄 RESPOSTA CONSULTA MP:', JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao consultar assinatura ${preapprovalId}`, error);
      console.log('🔥 ERRO CONSULTA MP:', JSON.stringify(error, null, 2));
      throw new BadRequestException('Assinatura não encontrada');
    }
  }

  async cancelSubscription(preapprovalId: string): Promise<boolean> {
    try {
      this.logger.log(`🛑 Cancelando assinatura: ${preapprovalId}`);
      await this.preApproval.update({
        id: preapprovalId,
        body: { status: 'cancelled' },
      });
      this.logger.log(`✅ Assinatura cancelada: ${preapprovalId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao cancelar assinatura`, error);
      console.log('🔥 ERRO CANCELAMENTO MP:', JSON.stringify(error, null, 2));
      return false;
    }
  }
}