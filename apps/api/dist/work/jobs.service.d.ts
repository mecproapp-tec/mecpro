import { PrismaService } from '../shared/prisma/prisma.service';
export declare class JobsService {
    private prisma;
    private readonly logger;
    private readonly cronEnabled;
    constructor(prisma: PrismaService);
    expireTrials(): Promise<void>;
    cleanExpiredSessions(): Promise<void>;
    cleanExpiredTokens(): Promise<void>;
}
