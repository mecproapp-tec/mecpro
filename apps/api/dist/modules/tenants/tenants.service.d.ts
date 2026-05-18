import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class TenantsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getById(id: string): Promise<{
        number: string;
        email: string;
        documentType: string;
        documentNumber: string;
        phone: string;
        cep: string;
        address: string;
        id: string;
        subscriptionId: string;
        trialEndsAt: Date;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.TenantStatus;
        name: string;
        logoUrl: string;
        paymentStatus: string;
        complement: string;
        subscriptions: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            planName: string;
            price: import("@prisma/client/runtime/library").Decimal;
            startDate: Date;
            endDate: Date;
        }[];
        users: {
            email: string;
            id: number;
            createdAt: Date;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
        }[];
    }>;
    update(id: string, data: any): Promise<{
        number: string;
        email: string;
        documentType: string;
        documentNumber: string;
        phone: string;
        address: string;
        id: string;
        updatedAt: Date;
        name: string;
        logoUrl: string;
        complement: string;
    }>;
}
