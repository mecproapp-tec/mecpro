import { PrismaService } from '../../shared/prisma/prisma.service';
import { InvoicesPdfService } from './invoices-pdf.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '@prisma/client';
export declare class InvoicesService {
    private prisma;
    private invoicesPdfService;
    private storageService;
    private readonly logger;
    constructor(prisma: PrismaService, invoicesPdfService: InvoicesPdfService, storageService: StorageService);
    private calculate;
    create(tenantId: string, data: any): Promise<{
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
            price: Prisma.Decimal;
            total: Prisma.Decimal;
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
        total: Prisma.Decimal;
        pdfUrl: string | null;
        clientId: number;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
        estimateId: number | null;
    }>;
    private generatePdfNow;
    private ensurePdf;
    findAll(tenantId: string, page?: number, limit?: number): Promise<{
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
                price: Prisma.Decimal;
                total: Prisma.Decimal;
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
            total: Prisma.Decimal;
            pdfUrl: string | null;
            clientId: number;
            shareToken: string | null;
            shareTokenExpires: Date | null;
            pdfGeneratedAt: Date | null;
            pdfStatus: string | null;
            pdfKey: string | null;
            estimateId: number | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number, tenantId: string): Promise<{
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
            price: Prisma.Decimal;
            total: Prisma.Decimal;
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
        total: Prisma.Decimal;
        pdfUrl: string | null;
        clientId: number;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
        estimateId: number | null;
    }>;
    update(id: number, tenantId: string, data: any): Promise<{
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
            price: Prisma.Decimal;
            total: Prisma.Decimal;
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
        total: Prisma.Decimal;
        pdfUrl: string | null;
        clientId: number;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
        estimateId: number | null;
    }>;
    remove(id: number, tenantId: string): Promise<{
        success: boolean;
    }>;
    generateShareLink(invoiceId: number, tenantId: string): Promise<{
        shareUrl: string;
    }>;
    sendToWhatsApp(id: number, tenantId: string, phoneNumber: string): Promise<{
        success: boolean;
        whatsappUrl: string;
    }>;
    resendPdf(id: number, tenantId: string): Promise<{
        success: boolean;
        pdfUrl: string;
    }>;
}
