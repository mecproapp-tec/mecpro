import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    findAll(user: UserPayload, page?: string, limit?: string, startDate?: string, endDate?: string): Promise<{
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
    findOne(id: string, user: UserPayload): Promise<{
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
    create(dto: CreateAppointmentDto, user: UserPayload): Promise<{
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
    update(id: string, dto: UpdateAppointmentDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<void>;
    private parseId;
}
export {};
