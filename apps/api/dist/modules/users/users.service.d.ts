import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, userRole?: string): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }[]>;
    findOne(id: number, tenantId: string, userRole?: string): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    update(id: number, tenantId: string, data: any, userRole?: string, currentUserId?: number): Promise<{
        email: string;
        id: number;
        updatedAt: Date;
        tenantId: string;
        name: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    remove(id: number, tenantId: string, userRole?: string, currentUserId?: number): Promise<{
        message: string;
    }>;
}
