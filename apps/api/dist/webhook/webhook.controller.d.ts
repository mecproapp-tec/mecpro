import { PaymentService } from '../payments/payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EmailService } from '../shared/email/email.service';
export declare class WebhookController {
    private paymentService;
    private prisma;
    private emailService;
    private readonly logger;
    constructor(paymentService: PaymentService, prisma: PrismaService, emailService: EmailService);
    mercadopagoWebhook(body: any, headers: any): Promise<{
        received: boolean;
    }>;
}
