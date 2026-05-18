import { NotificationsService } from './notifications.service';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: UserPayload, page?: string, limit?: string): Promise<{
        success: boolean;
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
    create(data: {
        title: string;
        message: string;
    }, user: UserPayload): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    findOne(id: string, user: UserPayload): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    markAsRead(id: string, user: UserPayload): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    markAllAsRead(user: UserPayload): Promise<{
        success: boolean;
    }>;
}
export {};
