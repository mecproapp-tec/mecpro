import { PaymentService } from './payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
declare class CreateSubscriptionDto {
    email: string;
    officeName?: string;
    documentType?: string;
    documentNumber?: string;
    phone?: string;
    cep?: string;
    address?: string;
    externalReference?: string;
}
export declare class PaymentController {
    private paymentService;
    private prisma;
    private configService;
    constructor(paymentService: PaymentService, prisma: PrismaService, configService: ConfigService);
    createSubscription(body: CreateSubscriptionDto): Promise<{
        success: boolean;
        checkoutLink: string;
        preapprovalId: string;
        pendingId: string;
    }>;
    getSubscriptionStatus(user: UserPayload): Promise<{
        success: boolean;
        data: {
            tenantStatus: import(".prisma/client").$Enums.TenantStatus;
            paymentStatus: string;
            trialEndsAt: Date;
            subscriptionId: string;
            currentPlan: {
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                planName: string;
                price: import("@prisma/client/runtime/library").Decimal;
                endDate: Date;
            };
        };
    }>;
    cancelSubscription(user: UserPayload): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
