import { PrismaService } from '../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { PaymentService } from '../payments/payment.service';
import { Request } from 'express';
import { RegisterAdminDto } from './dto/register-admin.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private paymentService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, paymentService: PaymentService);
    signup(data: {
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
    registerTenant(data: {
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
    registerAdmin(data: RegisterAdminDto): Promise<{
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
    login(email: string, password: string, req: Request): Promise<{
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
    logout(userId: number, sessionToken: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshTokenPlain: string, sessionToken?: string): Promise<{
        accessToken: string;
    }>;
    generateRefreshToken(): string;
    generateSessionToken(): string;
    getUserById(id: number): Promise<{
        id: number;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        tenantId: string;
        status: import(".prisma/client").$Enums.UserStatus;
        officeName: string;
        logoUrl: string;
        tenantStatus: import(".prisma/client").$Enums.TenantStatus;
    }>;
}
