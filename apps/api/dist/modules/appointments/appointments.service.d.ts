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
                name: string;
                tenantId: string;
                createdAt: Date;
                id: number;
                userId: number | null;
                phone: string;
                vehicle: string;
                plate: string;
                updatedAt: Date;
                address: string | null;
                document: string | null;
                deletedAt: Date | null;
                status: import(".prisma/client").$Enums.ClientStatus;
            };
        } & {
            tenantId: string;
            createdAt: Date;
            clientId: number;
            comment: string | null;
            date: Date;
            id: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number, tenantId: string): Promise<{
        client: {
            name: string;
            tenantId: string;
            createdAt: Date;
            id: number;
            userId: number | null;
            phone: string;
            vehicle: string;
            plate: string;
            updatedAt: Date;
            address: string | null;
            document: string | null;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.ClientStatus;
        };
    } & {
        tenantId: string;
        createdAt: Date;
        clientId: number;
        comment: string | null;
        date: Date;
        id: number;
    }>;
    create(tenantId: string, data: CreateAppointmentDto): Promise<{
        client: {
            name: string;
            tenantId: string;
            createdAt: Date;
            id: number;
            userId: number | null;
            phone: string;
            vehicle: string;
            plate: string;
            updatedAt: Date;
            address: string | null;
            document: string | null;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.ClientStatus;
        };
    } & {
        tenantId: string;
        createdAt: Date;
        clientId: number;
        comment: string | null;
        date: Date;
        id: number;
    }>;
    update(id: number, tenantId: string, data: UpdateAppointmentDto): Promise<{
        client: {
            name: string;
            tenantId: string;
            createdAt: Date;
            id: number;
            userId: number | null;
            phone: string;
            vehicle: string;
            plate: string;
            updatedAt: Date;
            address: string | null;
            document: string | null;
            deletedAt: Date | null;
            status: import(".prisma/client").$Enums.ClientStatus;
        };
    } & {
        tenantId: string;
        createdAt: Date;
        clientId: number;
        comment: string | null;
        date: Date;
        id: number;
    }>;
    remove(id: number, tenantId: string): Promise<{
        tenantId: string;
        createdAt: Date;
        clientId: number;
        comment: string | null;
        date: Date;
        id: number;
    }>;
    checkAppointmentsForNotifications(): Promise<void>;
}
