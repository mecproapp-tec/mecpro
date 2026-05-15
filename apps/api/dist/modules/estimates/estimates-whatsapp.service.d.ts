import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstimatesPdfService } from './estimates-pdf.service';
import { StorageService } from '../storage/storage.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class EstimatesWhatsappService {
    private readonly prisma;
    private readonly pdfService;
    private readonly storageService;
    private readonly whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, pdfService: EstimatesPdfService, storageService: StorageService, whatsappService: WhatsappService);
    private ensurePdf;
    sendWhatsApp(estimateId: number): Promise<{
        success: boolean;
        whatsappLink: string;
        message: string;
    }>;
}
