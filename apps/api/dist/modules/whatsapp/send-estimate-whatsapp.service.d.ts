import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimatesPdfService } from '../estimates/estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import { WhatsappService } from './whatsapp.service';
export declare class SendEstimateWhatsappService {
    private readonly prisma;
    private readonly pdfService;
    private readonly storageService;
    private readonly whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, pdfService: EstimatesPdfService, storageService: StorageService, whatsappService: WhatsappService);
    private ensurePdf;
    execute(estimateId: number): Promise<{
        success: boolean;
        whatsappUrl: string;
        message: string;
    }>;
}
