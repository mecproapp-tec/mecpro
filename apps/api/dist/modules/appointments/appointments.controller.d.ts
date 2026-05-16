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
    findOne(id: string, user: UserPayload): Promise<{
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
    create(dto: CreateAppointmentDto, user: UserPayload): Promise<{
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
    update(id: string, dto: UpdateAppointmentDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<void>;
    private parseId;
}
export {};
