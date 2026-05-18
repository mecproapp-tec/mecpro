import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class PublicShareService {
    private prisma;
    constructor(prisma: PrismaService);
    create({ tenantId, type, resourceId, expiresInDays, }: {
        tenantId: string;
        type: 'ESTIMATE' | 'INVOICE';
        resourceId: number;
        expiresInDays?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        expiresAt: Date | null;
        token: string;
        type: import(".prisma/client").$Enums.ShareType;
        resourceId: number;
        pdfUrl: string | null;
    }>;
    findByToken(token: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        expiresAt: Date | null;
        token: string;
        type: import(".prisma/client").$Enums.ShareType;
        resourceId: number;
        pdfUrl: string | null;
    }>;
    getPublicData(token: string): Promise<{
        id: number;
        total: number;
        date: Date;
        status: import(".prisma/client").$Enums.EstimateStatus;
        client: {
            id: number;
            name: string;
            phone: string;
            vehicle: string;
            plate: string;
            address: string;
            document: string;
        };
        items: {
            description: string;
            quantity: number;
            price: number;
            total: number;
            issPercent: number;
        }[];
        tenant: {
            name: string;
            documentNumber: string;
            phone: string;
            email: string;
            logoUrl: string;
        };
        pdfUrl: string;
        number?: undefined;
        createdAt?: undefined;
    } | {
        id: number;
        number: string;
        total: number;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        createdAt: Date;
        client: {
            id: number;
            name: string;
            phone: string;
            vehicle: string;
            plate: string;
            address: string;
            document: string;
        };
        items: {
            description: string;
            quantity: number;
            price: number;
            total: number;
            issPercent: number;
        }[];
        tenant: {
            name: string;
            documentNumber: string;
            phone: string;
            email: string;
            logoUrl: string;
        };
        pdfUrl: string;
        date?: undefined;
    }>;
    regenerate(token: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        expiresAt: Date | null;
        token: string;
        type: import(".prisma/client").$Enums.ShareType;
        resourceId: number;
        pdfUrl: string | null;
    }>;
    delete(token: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        expiresAt: Date | null;
        token: string;
        type: import(".prisma/client").$Enums.ShareType;
        resourceId: number;
        pdfUrl: string | null;
    }>;
}
