import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class BillingGuard implements CanActivate {
    private prisma;
    private cache;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService);
    private getCachedTenant;
    private setCachedTenant;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
