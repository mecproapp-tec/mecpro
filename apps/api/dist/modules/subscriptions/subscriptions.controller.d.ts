import { SubscriptionsService } from './subscriptions.service';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class SubscriptionsController {
    private subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getMySubscription(user: UserPayload): Promise<{
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
    createCheckout(user: UserPayload, email: string): Promise<{
        checkoutLink: string;
        pendingId: string;
    }>;
    cancelSubscription(user: UserPayload): Promise<{
        success: boolean;
        message: string;
    }>;
    findAllSubscriptions(page?: string, limit?: string): Promise<{
        success: boolean;
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
export {};
