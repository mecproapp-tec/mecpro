import { PrismaService } from '../../shared/prisma/prisma.service';
import { TenantStatus } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';
import { EstimatesService } from '../estimates/estimates.service';
import { PdfService } from '../pdf/pdf.service';
import { MailService } from '../mail/mail.service';
export declare class AdminService {
    private prisma;
    private invoicesService;
    private estimatesService;
    private pdfService;
    private mailService;
    constructor(prisma: PrismaService, invoicesService: InvoicesService, estimatesService: EstimatesService, pdfService: PdfService, mailService: MailService);
    getDashboard(): Promise<{
        totalTenants: number;
        activeTenants: number;
        blockedTenants: number;
        totalClients: number;
        totalEstimates: number;
        totalInvoices: number;
        recentTenants: {
            status: import(".prisma/client").$Enums.TenantStatus;
            createdAt: Date;
            id: string;
            name: string;
            email: string;
        }[];
    }>;
    getTenants(query: {
        status?: string;
        search?: string;
    }): Promise<({
        _count: {
            estimates: number;
            invoices: number;
            clients: number;
        };
    } & {
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
    })[]>;
    getTenant(id: string): Promise<{
        estimates: ({
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
        invoices: ({
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
        })[];
        clients: {
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
        }[];
        users: {
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string | null;
            id: number;
            name: string;
            email: string;
            paymentStatus: string | null;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            tokenVersion: number;
        }[];
    } & {
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
    }>;
    updateTenantStatus(id: string, status: TenantStatus): Promise<{
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
    }>;
    deleteTenant(id: string): Promise<void>;
    getFinancialSummary(query: {
        month?: number;
        year?: number;
    }): Promise<{
        message: string;
    }>;
    getAllClients(user: any, query: {
        search?: string;
        tenantId?: string;
    }): Promise<{
        tenantName: string;
        tenant: {
            name: string;
        };
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
    }[]>;
    getClientById(id: number): Promise<{
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
        estimates: {
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
        }[];
        invoices: {
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
        }[];
    } & {
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
    }>;
    blockClient(id: number): Promise<{
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
    }>;
    activateClient(id: number): Promise<{
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
    }>;
    sendMessageToClient(clientId: number, data: {
        subject: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllEstimates(user: any, query: {
        status?: string;
        tenantId?: string;
    }): Promise<{
        total: number;
        clientName: string;
        tenantName: string;
        client: {
            name: string;
        };
        tenant: {
            name: string;
        };
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
    }[]>;
    getEstimatePdf(id: number): Promise<Buffer<ArrayBufferLike>>;
    getAllInvoices(user: any, query: {
        status?: string;
        tenantId?: string;
    }): Promise<{
        total: number;
        clientName: string;
        tenantName: string;
        client: {
            name: string;
        };
        tenant: {
            name: string;
        };
        number: string;
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
    }[]>;
    getInvoicePdf(id: number): Promise<Buffer<ArrayBufferLike>>;
    getAllUsers(query: {
        search?: string;
        role?: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        id: number;
        name: string;
        email: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }[]>;
    blockUser(id: number): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        id: number;
        name: string;
        email: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }>;
    activateUser(id: number): Promise<{
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        id: number;
        name: string;
        email: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }>;
    sendNotification(data: {
        title: string;
        message: string;
        target: string;
        tenantIds?: string[];
    }): Promise<{
        success: boolean;
    }>;
    scheduleNotification(data: any): Promise<{
        success: boolean;
        scheduled: boolean;
    }>;
    getNotifications(): Promise<({
        tenant: {
            name: string;
            email: string;
        };
    } & {
        createdAt: Date;
        tenantId: string | null;
        id: number;
        title: string;
        message: string;
        isGlobal: boolean;
        read: boolean;
        appointmentId: number | null;
    })[]>;
    markAsRead(id: number): Promise<{
        createdAt: Date;
        tenantId: string | null;
        id: number;
        title: string;
        message: string;
        isGlobal: boolean;
        read: boolean;
        appointmentId: number | null;
    }>;
    markAllAsRead(): Promise<{
        success: boolean;
    }>;
    deleteNotification(id: number): Promise<void>;
    getAllContactMessages(query: {
        status?: string;
        search?: string;
    }): Promise<({
        tenant: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        id: number;
        message: string;
        userEmail: string | null;
        userName: string | null;
        reply: string | null;
    })[]>;
    replyToContactMessage(id: number, replyText: string): Promise<{
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        id: number;
        message: string;
        userEmail: string | null;
        userName: string | null;
        reply: string | null;
    }>;
    deleteContactMessage(id: number): Promise<void>;
}
