import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(body: {
        name: string;
        email: string;
        password: string;
        tenantId: string;
    }): Promise<{
        email: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.UserStatus;
        tenantId: string | null;
        name: string;
        paymentStatus: string | null;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        tokenVersion: number;
    }>;
    registerTenant(body: {
        officeName: string;
        documentType: string;
        documentNumber: string;
        cep: string;
        address: string;
        email: string;
        phone: string;
        ownerName: string;
        password: string;
        paymentCompleted: boolean;
        preapprovalId?: string;
    }): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            officeName: string;
        };
    }>;
    registerAdmin(body: RegisterAdminDto): Promise<{
        message: string;
        user: {
            email: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.UserStatus;
            tenantId: string | null;
            name: string;
            paymentStatus: string | null;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            tokenVersion: number;
        };
    }>;
    login(body: LoginDto, req: Request): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            name: string;
            email: string;
            officeName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    logout(user: UserPayload): Promise<{
        message: string;
    }>;
    getMe(user: UserPayload): Promise<{
        success: boolean;
        user: {
            id: number;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            tenantId: string;
            status: import(".prisma/client").$Enums.UserStatus;
            officeName: string;
            logoUrl: string;
            tenantStatus: import(".prisma/client").$Enums.TenantStatus;
        };
    }>;
}
export {};
