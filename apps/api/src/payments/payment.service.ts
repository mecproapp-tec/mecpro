import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private client: MercadoPagoConfig;
  private preApproval: PreApproval;
  private payment: Payment;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.error('Mercado Pago Access Token not configured');
      throw new Error('Mercado Pago Access Token not configured');
    }

    this.client = new MercadoPagoConfig({ accessToken });
    this.preApproval = new PreApproval(this.client);
    this.payment = new Payment(this.client);

    this.logger.log('Mercado Pago initialized successfully');
  }

  async createSubscription(params: {
    email: string;
    externalReference: string;
    backUrl: string;
  }): Promise<{ checkoutLink: string; preapprovalId: string }> {
    try {
      this.logger.log(`Creating subscription for ${params.email}`);

      if (!params.email) {
        throw new BadRequestException('Email is required');
      }

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
        },
      });

      const preapprovalId = response.id;
      const checkoutLink = response.init_point;

      if (!checkoutLink) {
        this.logger.error('Mercado Pago did not return checkout link');
        throw new BadRequestException('Mercado Pago did not return checkout link');
      }

      this.logger.log(
        `Subscription created: ${JSON.stringify({
          id: preapprovalId,
          status: response.status,
          init_point: checkoutLink,
          payer_email: params.email,
          external_reference: params.externalReference,
        })}`,
      );

      return { checkoutLink, preapprovalId };
    } catch (error: any) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw new BadRequestException(error?.message || 'Failed to create subscription');
    }
  }

  async getSubscription(preapprovalId: string): Promise<any> {
    try {
      this.logger.log(`Fetching subscription: ${preapprovalId}`);
      const response = await this.preApproval.get({ id: preapprovalId });
      this.logger.log(
        `Subscription fetched: ${JSON.stringify({
          id: response.id,
          status: response.status,
          payer_email: response.payer_email,
          external_reference: response.external_reference,
          next_payment_date: response.next_payment_date,
        })}`,
      );
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to fetch subscription ${preapprovalId}: ${error.message}`);
      throw new BadRequestException('Subscription not found');
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      this.logger.log(`Fetching payment: ${paymentId}`);
      const response = await this.payment.get({ id: paymentId });
      this.logger.log(
        `Payment fetched: ${JSON.stringify({
          id: response.id,
          status: response.status,
          type: response.payment_type_id,
        })}`,
      );
      return response;
    } catch (error: any) {
      this.logger.error(`Failed to fetch payment ${paymentId}: ${error.message}`);
      return null;
    }
  }

  async cancelSubscription(preapprovalId: string): Promise<boolean> {
    try {
      this.logger.log(`Cancelling subscription: ${preapprovalId}`);
      await this.preApproval.update({
        id: preapprovalId,
        body: { status: 'cancelled' },
      });
      this.logger.log(`Subscription cancelled: ${preapprovalId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription ${preapprovalId}: ${error.message}`);
      return false;
    }
  }
}