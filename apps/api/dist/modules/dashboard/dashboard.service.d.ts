import { PrismaService } from "../../shared/prisma/prisma.service";
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(tenantId: string, userRole: string): Promise<{
        clients: number;
        estimates: number;
        invoices: number;
        tenantId: string;
    }>;
}
