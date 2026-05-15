import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class EstimatesController {
    private readonly estimatesService;
    constructor(estimatesService: EstimatesService);
    findAll(user: UserPayload, page?: string, limit?: string): Promise<{
        data: ({
            client: {
                phone: string;
                address: string | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ClientStatus;
                tenantId: string;
                name: string;
                userId: number | null;
                vehicle: string;
                plate: string;
                document: string | null;
                deletedAt: Date | null;
            };
            items: {
                id: number;
                price: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
                description: string;
                quantity: number;
                issPercent: number | null;
                estimateId: number;
            }[];
        } & {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.EstimateStatus;
            tenantId: string;
            deletedAt: Date | null;
            total: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
            clientId: number;
            date: Date;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfKey: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: UserPayload): Promise<{
        tenant: {
            number: string | null;
            email: string;
            documentType: string;
            documentNumber: string;
            phone: string;
            cep: string;
            address: string;
            id: string;
            subscriptionId: string | null;
            trialEndsAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TenantStatus;
            name: string;
            logoUrl: string | null;
            paymentStatus: string | null;
            complement: string | null;
            registrationToken: string | null;
            registrationTokenExpiresAt: Date | null;
        };
        client: {
            phone: string;
            address: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ClientStatus;
            tenantId: string;
            name: string;
            userId: number | null;
            vehicle: string;
            plate: string;
            document: string | null;
            deletedAt: Date | null;
        };
        items: {
            id: number;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            description: string;
            quantity: number;
            issPercent: number | null;
            estimateId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EstimateStatus;
        tenantId: string;
        deletedAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        clientId: number;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
    }>;
    getShareLink(id: string, user: UserPayload): Promise<{
        shareUrl: string;
    }>;
    create(createDto: CreateEstimateDto, user: UserPayload): Promise<{
        tenant: {
            number: string | null;
            email: string;
            documentType: string;
            documentNumber: string;
            phone: string;
            cep: string;
            address: string;
            id: string;
            subscriptionId: string | null;
            trialEndsAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.TenantStatus;
            name: string;
            logoUrl: string | null;
            paymentStatus: string | null;
            complement: string | null;
            registrationToken: string | null;
            registrationTokenExpiresAt: Date | null;
        };
        client: {
            phone: string;
            address: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ClientStatus;
            tenantId: string;
            name: string;
            userId: number | null;
            vehicle: string;
            plate: string;
            document: string | null;
            deletedAt: Date | null;
        };
        items: {
            id: number;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            description: string;
            quantity: number;
            issPercent: number | null;
            estimateId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EstimateStatus;
        tenantId: string;
        deletedAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        clientId: number;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
    }>;
    update(id: string, updateDto: UpdateEstimateDto, user: UserPayload): Promise<{
        client: {
            phone: string;
            address: string | null;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ClientStatus;
            tenantId: string;
            name: string;
            userId: number | null;
            vehicle: string;
            plate: string;
            document: string | null;
            deletedAt: Date | null;
        };
        items: {
            id: number;
            price: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            description: string;
            quantity: number;
            issPercent: number | null;
            estimateId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EstimateStatus;
        tenantId: string;
        deletedAt: Date | null;
        total: import("@prisma/client/runtime/library").Decimal;
        pdfUrl: string | null;
        clientId: number;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
    }>;
    convertToInvoice(id: string, user: UserPayload): Promise<{
        message: string;
        invoiceId: number;
        invoiceNumber: string;
        invoice: {
            client: {
                phone: string;
                address: string | null;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.ClientStatus;
                tenantId: string;
                name: string;
                userId: number | null;
                vehicle: string;
                plate: string;
                document: string | null;
                deletedAt: Date | null;
            };
            items: {
                id: number;
                price: import("@prisma/client/runtime/library").Decimal;
                total: import("@prisma/client/runtime/library").Decimal;
                description: string;
                quantity: number;
                issPercent: number | null;
                invoiceId: number;
            }[];
        } & {
            number: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            tenantId: string;
            deletedAt: Date | null;
            total: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
            clientId: number;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfKey: string | null;
            estimateId: number | null;
        };
    }>;
    remove(id: string, user: UserPayload): Promise<void>;
    sendToWhatsApp(id: string, phoneNumber: string, user: UserPayload): Promise<{
        success: boolean;
        whatsappUrl: string;
        phoneNumber: string;
    }>;
    resendPdf(id: string, user: UserPayload): Promise<{
        success: boolean;
        pdfUrl: string;
    }>;
}
export {};
