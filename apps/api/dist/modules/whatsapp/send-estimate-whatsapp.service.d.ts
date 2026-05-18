import { PrismaService } from '../../shared/prisma/prisma.service';
import { PublicShareService } from '../public-share/public-share.service';
import { WhatsappService } from './whatsapp.service';
export declare class SendEstimateWhatsappService {
    private prisma;
    private publicShareService;
    private whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, publicShareService: PublicShareService, whatsappService: WhatsappService);
    execute(estimateId: number): Promise<any>;
}
