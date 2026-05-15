import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    findAll(user: UserPayload, page?: string, limit?: string): Promise<{
        data: {
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: UserPayload): Promise<{
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
    create(createDto: CreateClientDto, user: UserPayload): Promise<{
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
    update(id: string, updateDto: UpdateClientDto, user: UserPayload): Promise<{
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
    remove(id: string, user: UserPayload): Promise<void>;
    private parseId;
}
export {};
