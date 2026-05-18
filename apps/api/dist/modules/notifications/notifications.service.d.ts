import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, page?: number, limit?: number): Promise<{
        data: ({
            appointment: {
                id: number;
                createdAt: Date;
                tenantId: string;
                clientId: number;
                date: Date;
                comment: string | null;
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number, tenantId: string): Promise<{
        appointment: {
            id: number;
            createdAt: Date;
            tenantId: string;
            clientId: number;
            date: Date;
            comment: string | null;
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
    }>;
    markAsRead(id: number, tenantId: string): Promise<{
        appointment: {
            id: number;
            createdAt: Date;
            tenantId: string;
            clientId: number;
            date: Date;
            comment: string | null;
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
    }>;
    markAllAsRead(tenantId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    create(tenantId: string, title: string, message: string, appointmentId?: number): Promise<{
        appointment: {
            id: number;
            createdAt: Date;
            tenantId: string;
            clientId: number;
            date: Date;
            comment: string | null;
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
    }>;
    createForAppointment(appointmentId: number, tenantId: string, title: string, message: string): Promise<{
        id: number;
        createdAt: Date;
        tenantId: string | null;
        read: boolean;
        title: string;
        message: string;
        isGlobal: boolean;
        appointmentId: number | null;
    }>;
}
