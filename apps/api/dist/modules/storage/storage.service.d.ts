import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
export declare class StorageService {
    private configService;
    private prisma;
    private readonly logger;
    private s3Client;
    private bucket;
    private publicUrl;
    private useR2;
    private localUploadPath;
    constructor(configService: ConfigService, prisma: PrismaService);
    private ensureLocalDirectory;
    validateShareToken(token: string): Promise<boolean>;
    checkFileAccess(fileKey: string, tenantId: string): Promise<boolean>;
    uploadPdf(buffer: Buffer, key: string, tenantId?: string): Promise<string>;
    private uploadPdfLocal;
    private sanitizeKey;
    getPublicUrl(key: string): string;
    getFile(key: string, tenantId?: string): Promise<Buffer>;
    deleteFile(key: string): Promise<void>;
}
