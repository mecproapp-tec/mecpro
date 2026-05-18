import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class PaymentController {
    private readonly paymentService;
    private readonly prisma;
    private readonly configService;
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
