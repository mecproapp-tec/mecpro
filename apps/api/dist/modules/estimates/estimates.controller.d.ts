import { Response } from 'express';
import { EstimatesService } from './estimates.service';
import { EstimatesPdfService } from './estimates-pdf.service';
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
    private readonly pdfService;
    constructor(estimatesService: EstimatesService, pdfService: EstimatesPdfService);
    findAll(user: UserPayload, page?: string, limit?: string): Promise<{
        data: ({
            client: {
                status: import(".prisma/client").$Enums.ClientStatus;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                tenantId: string;
                id: number;
                name: string;
                userId: number | null;
                phone: string;
                vehicle: string;
                plate: string;
                address: string | null;
                document: string | null;
            };
            items: {
                total: import("@prisma/client/runtime/library").Decimal;
                id: number;
                description: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                issPercent: number | null;
                estimateId: number;
            }[];
        } & {
            total: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.EstimateStatus;
            createdAt: Date;
            updatedAt: Date;
            date: Date;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfUrl: string | null;
            pdfKey: string | null;
            deletedAt: Date | null;
            tenantId: string;
            clientId: number;
            id: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findConverted(user: UserPayload, page?: string, limit?: string): Promise<{
        data: ({
            client: {
                status: import(".prisma/client").$Enums.ClientStatus;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                tenantId: string;
                id: number;
                name: string;
                userId: number | null;
                phone: string;
                vehicle: string;
                plate: string;
                address: string | null;
                document: string | null;
            };
            items: {
                total: import("@prisma/client/runtime/library").Decimal;
                id: number;
                description: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                issPercent: number | null;
                estimateId: number;
            }[];
            invoice: {
                number: string;
                total: import("@prisma/client/runtime/library").Decimal;
                status: import(".prisma/client").$Enums.InvoiceStatus;
                createdAt: Date;
                updatedAt: Date;
                shareToken: string | null;
                shareTokenExpires: Date | null;
                pdfGeneratedAt: Date | null;
                pdfStatus: string | null;
                pdfUrl: string | null;
                pdfKey: string | null;
                deletedAt: Date | null;
                tenantId: string;
                clientId: number;
                id: number;
                estimateId: number | null;
            };
        } & {
            total: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.EstimateStatus;
            createdAt: Date;
            updatedAt: Date;
            date: Date;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfUrl: string | null;
            pdfKey: string | null;
            deletedAt: Date | null;
            tenantId: string;
            clientId: number;
            id: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: UserPayload): Promise<{
        client: {
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            id: number;
            name: string;
            userId: number | null;
            phone: string;
            vehicle: string;
            plate: string;
            address: string | null;
            document: string | null;
        };
        tenant: {
            number: string | null;
            status: import(".prisma/client").$Enums.TenantStatus;
            createdAt: Date;
            updatedAt: Date;
            id: string;
            name: string;
            phone: string;
            address: string;
            documentType: string;
            documentNumber: string;
            cep: string;
            email: string;
            logoUrl: string | null;
            trialEndsAt: Date | null;
            paymentStatus: string | null;
            subscriptionId: string | null;
            complement: string | null;
            registrationToken: string | null;
            registrationTokenExpiresAt: Date | null;
        };
        items: {
            total: import("@prisma/client/runtime/library").Decimal;
            id: number;
            description: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            issPercent: number | null;
            estimateId: number;
        }[];
        invoice: {
            number: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            createdAt: Date;
            updatedAt: Date;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfUrl: string | null;
            pdfKey: string | null;
            deletedAt: Date | null;
            tenantId: string;
            clientId: number;
            id: number;
            estimateId: number | null;
        };
    } & {
        total: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.EstimateStatus;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfUrl: string | null;
        pdfKey: string | null;
        deletedAt: Date | null;
        tenantId: string;
        clientId: number;
        id: number;
    }>;
    downloadPdf(id: string, user: UserPayload, res: Response): Promise<void>;
    getShareLink(id: string, user: UserPayload): Promise<{
        shareUrl: string;
    }>;
    create(createDto: CreateEstimateDto, user: UserPayload): Promise<{
        client: {
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            id: number;
            name: string;
            userId: number | null;
            phone: string;
            vehicle: string;
            plate: string;
            address: string | null;
            document: string | null;
        };
        tenant: {
            number: string | null;
            status: import(".prisma/client").$Enums.TenantStatus;
            createdAt: Date;
            updatedAt: Date;
            id: string;
            name: string;
            phone: string;
            address: string;
            documentType: string;
            documentNumber: string;
            cep: string;
            email: string;
            logoUrl: string | null;
            trialEndsAt: Date | null;
            paymentStatus: string | null;
            subscriptionId: string | null;
            complement: string | null;
            registrationToken: string | null;
            registrationTokenExpiresAt: Date | null;
        };
        items: {
            total: import("@prisma/client/runtime/library").Decimal;
            id: number;
            description: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            issPercent: number | null;
            estimateId: number;
        }[];
    } & {
        total: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.EstimateStatus;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfUrl: string | null;
        pdfKey: string | null;
        deletedAt: Date | null;
        tenantId: string;
        clientId: number;
        id: number;
    }>;
    update(id: string, updateDto: UpdateEstimateDto, user: UserPayload): Promise<{
        client: {
            status: import(".prisma/client").$Enums.ClientStatus;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            id: number;
            name: string;
            userId: number | null;
            phone: string;
            vehicle: string;
            plate: string;
            address: string | null;
            document: string | null;
        };
        items: {
            total: import("@prisma/client/runtime/library").Decimal;
            id: number;
            description: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            issPercent: number | null;
            estimateId: number;
        }[];
    } & {
        total: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.EstimateStatus;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfUrl: string | null;
        pdfKey: string | null;
        deletedAt: Date | null;
        tenantId: string;
        clientId: number;
        id: number;
    }>;
    convertToInvoice(id: string, user: UserPayload): Promise<{
        message: string;
        invoiceId: number;
        invoiceNumber: string;
        invoice: {
            client: {
                status: import(".prisma/client").$Enums.ClientStatus;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                tenantId: string;
                id: number;
                name: string;
                userId: number | null;
                phone: string;
                vehicle: string;
                plate: string;
                address: string | null;
                document: string | null;
            };
            items: {
                total: import("@prisma/client/runtime/library").Decimal;
                id: number;
                description: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                issPercent: number | null;
                invoiceId: number;
            }[];
        } & {
            number: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            createdAt: Date;
            updatedAt: Date;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfUrl: string | null;
            pdfKey: string | null;
            deletedAt: Date | null;
            tenantId: string;
            clientId: number;
            id: number;
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
