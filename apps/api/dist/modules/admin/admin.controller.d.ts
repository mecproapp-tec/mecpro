import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { TenantStatus } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        totalTenants: number;
        activeTenants: number;
        blockedTenants: number;
        totalClients: number;
        totalEstimates: number;
        totalInvoices: number;
        recentTenants: {
            email: string;
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TenantStatus;
            name: string;
        }[];
    }>;
    getTenants(query: any): Promise<({
        _count: {
            clients: number;
            estimates: number;
            invoices: number;
        };
    } & {
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
    })[]>;
    getTenant(id: string): Promise<{
        clients: {
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
        }[];
        estimates: ({
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
        invoices: ({
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
        })[];
        users: {
            email: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.UserStatus;
            tenantId: string | null;
            name: string;
            paymentStatus: string | null;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            tokenVersion: number;
        }[];
    } & {
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
    }>;
    updateTenantStatus(id: string, status: TenantStatus): Promise<{
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
    }>;
    deleteTenant(id: string): Promise<void>;
    getFinancialSummary(query: any): Promise<{
        message: string;
    }>;
    getAllClients(req: Request, query: any): Promise<{
        tenantName: string;
        tenant: {
            name: string;
        };
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
    }[]>;
    getClientById(id: string): Promise<{
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
        estimates: {
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
        }[];
        invoices: {
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
        }[];
    } & {
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
    }>;
    blockClient(id: string): Promise<{
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
    }>;
    activateClient(id: string): Promise<{
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
    }>;
    sendMessageToClient(id: string, body: {
        subject: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllEstimates(req: Request, query: any): Promise<{
        total: number;
        clientName: string;
        tenantName: string;
        tenant: {
            name: string;
        };
        client: {
            name: string;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.EstimateStatus;
        tenantId: string;
        deletedAt: Date | null;
        pdfUrl: string | null;
        clientId: number;
        date: Date;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
    }[]>;
    getEstimatePdf(id: string, res: Response): Promise<void>;
    getAllInvoices(req: Request, query: any): Promise<{
        total: number;
        clientName: string;
        tenantName: string;
        tenant: {
            name: string;
        };
        client: {
            name: string;
        };
        number: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        tenantId: string;
        deletedAt: Date | null;
        pdfUrl: string | null;
        clientId: number;
        shareToken: string | null;
        shareTokenExpires: Date | null;
        pdfGeneratedAt: Date | null;
        pdfStatus: string | null;
        pdfKey: string | null;
        estimateId: number | null;
    }[]>;
    getInvoicePdf(id: string, res: Response): Promise<void>;
    getAllUsers(query: any): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        tenantId: string | null;
        name: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }[]>;
    blockUser(id: string): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        tenantId: string | null;
        name: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }>;
    activateUser(id: string): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        tenantId: string | null;
        name: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }>;
    sendNotification(body: any): Promise<{
        success: boolean;
    }>;
    scheduleNotification(body: any): Promise<{
        success: boolean;
        scheduled: boolean;
    }>;
    getNotifications(): Promise<({
        tenant: {
            email: string;
            name: string;
        };
    } & {
        id: number;
        createdAt: Date;
        tenantId: string | null;
        read: boolean;
        title: string;
        message: string;
        isGlobal: boolean;
        appointmentId: number | null;
    })[]>;
    markAsRead(id: string): Promise<{
        id: number;
        createdAt: Date;
        tenantId: string | null;
        read: boolean;
        title: string;
        message: string;
        isGlobal: boolean;
        appointmentId: number | null;
    }>;
    markAllAsRead(): Promise<{
        success: boolean;
    }>;
    deleteNotification(id: string): Promise<void>;
    getAllContactMessages(query: any): Promise<({
        tenant: {
            email: string;
            id: string;
            name: string;
        };
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string | null;
        message: string;
        userEmail: string | null;
        userName: string | null;
        reply: string | null;
    })[]>;
    replyToContactMessage(id: string, body: {
        reply: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tenantId: string | null;
        message: string;
        userEmail: string | null;
        userName: string | null;
        reply: string | null;
    }>;
    deleteContactMessage(id: string): Promise<void>;
}
