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
            status: import(".prisma/client").$Enums.TenantStatus;
            createdAt: Date;
            id: string;
            name: string;
            email: string;
        }[];
    }>;
    getTenants(query: any): Promise<({
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
    getFinancialSummary(query: any): Promise<{
        message: string;
    }>;
    getAllClients(req: Request, query: any): Promise<{
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
    getClientById(id: string): Promise<{
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
    blockClient(id: string): Promise<{
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
    activateClient(id: string): Promise<{
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
    getEstimatePdf(id: string, res: Response): Promise<void>;
    getAllInvoices(req: Request, query: any): Promise<{
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
    getInvoicePdf(id: string, res: Response): Promise<void>;
    getAllUsers(query: any): Promise<{
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
    blockUser(id: string): Promise<{
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
    activateUser(id: string): Promise<{
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
    sendNotification(body: any): Promise<{
        success: boolean;
    }>;
    scheduleNotification(body: any): Promise<{
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
    markAsRead(id: string): Promise<{
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
    deleteNotification(id: string): Promise<void>;
    getAllContactMessages(query: any): Promise<({
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
    replyToContactMessage(id: string, body: {
        reply: string;
    }): Promise<{
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
    deleteContactMessage(id: string): Promise<void>;
}
