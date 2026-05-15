import { PrismaService } from '../../shared/prisma/prisma.service';
import { Client } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
export declare class ClientsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: CreateClientDto): Promise<Client>;
    findAll(tenantId: string, page?: number, limit?: number): Promise<{
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
    findOne(id: number, tenantId: string): Promise<Client>;
    update(id: number, tenantId: string, data: UpdateClientDto): Promise<Client>;
    remove(id: number, tenantId: string): Promise<void>;
}
