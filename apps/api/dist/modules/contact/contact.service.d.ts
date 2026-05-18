import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ContactService {
    private prisma;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    create(data: {
        userEmail?: string;
        userName?: string;
        message: string;
        tenantId?: string;
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
    findAll(): Promise<{
        tenant: {
            email: string;
            phone: string;
            id: string;
            name: string;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        message: string;
        userEmail: string;
        userName: string;
        reply: string;
    }[]>;
    findOne(id: number): Promise<{
        tenant: {
            email: string;
            phone: string;
            id: string;
            name: string;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        message: string;
        userEmail: string;
        userName: string;
        reply: string;
    }>;
    reply(id: number, reply: string): Promise<{
        tenant: {
            email: string;
            phone: string;
            id: string;
            name: string;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        message: string;
        userEmail: string;
        userName: string;
        reply: string;
    }>;
    remove(id: number): Promise<{
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
}
