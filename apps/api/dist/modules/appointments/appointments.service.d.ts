import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
export declare class AppointmentsService {
    private prisma;
    private notificationsService;
    private readonly logger;
    private isCronRunning;
    private readonly cronEnabled;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    findAll(tenantId: string, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
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
        } & {
            id: number;
            createdAt: Date;
            tenantId: string;
            clientId: number;
            date: Date;
            comment: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number, tenantId: string): Promise<{
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
        tenantId: string;
        clientId: number;
        date: Date;
        comment: string | null;
    }>;
    create(tenantId: string, data: CreateAppointmentDto): Promise<{
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
        tenantId: string;
        clientId: number;
        date: Date;
        comment: string | null;
    }>;
    update(id: number, tenantId: string, data: UpdateAppointmentDto): Promise<{
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
        tenantId: string;
        clientId: number;
        date: Date;
        comment: string | null;
    }>;
    remove(id: number, tenantId: string): Promise<{
        id: number;
        createdAt: Date;
        tenantId: string;
        clientId: number;
        date: Date;
        comment: string | null;
    }>;
    checkAppointmentsForNotifications(): Promise<void>;
}
