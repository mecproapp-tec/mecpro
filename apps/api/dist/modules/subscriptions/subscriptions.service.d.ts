import { PrismaService } from '../../shared/prisma/prisma.service';
import { PaymentService } from '../../payments/payment.service';
import { ConfigService } from '@nestjs/config';
export declare class SubscriptionsService {
    private prisma;
    private paymentService;
    private configService;
    constructor(prisma: PrismaService, paymentService: PaymentService, configService: ConfigService);
    getByTenantId(tenantId: string): Promise<{
        payments: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            gatewayPaymentId: string;
            paidAt: Date;
        }[];
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        planName: string;
        price: import("@prisma/client/runtime/library").Decimal;
        gateway: string;
        gatewaySubscriptionId: string;
        startDate: Date;
        endDate: Date;
    }>;
    getById(id: string): Promise<{
        tenant: {
            email: string;
            phone: string;
            id: string;
            status: import(".prisma/client").$Enums.TenantStatus;
            name: string;
        };
        payments: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            gatewayPaymentId: string;
            paidAt: Date;
        }[];
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        planName: string;
        price: import("@prisma/client/runtime/library").Decimal;
        gateway: string;
        gatewaySubscriptionId: string;
        startDate: Date;
        endDate: Date;
    }>;
    createSubscription(data: {
        tenantId: string;
        planName: string;
        price: number;
        gateway: string;
        gatewaySubscriptionId: string;
        startDate: Date;
        endDate?: Date;
    }): Promise<{
        tenant: {
            email: string;
            id: string;
            name: string;
        };
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        planName: string;
        price: import("@prisma/client/runtime/library").Decimal;
        gateway: string;
        gatewaySubscriptionId: string;
        startDate: Date;
        endDate: Date;
    }>;
    getSubscriptionStatus(tenantId: string): Promise<{
        status: import(".prisma/client").$Enums.TenantStatus;
        paymentStatus: string;
        trialEndsAt: Date;
        subscriptionId: string;
        hasActiveSubscription: boolean;
        plan: {
            name: string;
            price: import("@prisma/client/runtime/library").Decimal;
            endDate: Date;
        };
    }>;
    createCheckout(tenantId: string, email: string): Promise<{
        checkoutLink: string;
        pendingId: string;
    }>;
    cancelSubscription(tenantId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findAllSubscriptions(page?: number, limit?: number): Promise<{
        data: ({
            tenant: {
                email: string;
                phone: string;
                id: string;
                status: import(".prisma/client").$Enums.TenantStatus;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            tenantId: string;
            planName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            gateway: string;
            gatewaySubscriptionId: string | null;
            startDate: Date;
            endDate: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
