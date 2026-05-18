import { SendEstimateWhatsappService } from './send-estimate-whatsapp.service';
import { SendInvoiceWhatsappService } from './send-invoice-whatsapp.service';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class WhatsappController {
    private sendEstimateWhatsapp;
    private sendInvoiceWhatsapp;
    constructor(sendEstimateWhatsapp: SendEstimateWhatsappService, sendInvoiceWhatsapp: SendInvoiceWhatsappService);
    sendEstimateLink(id: string, user: UserPayload): Promise<any>;
    sendInvoiceLink(id: string, user: UserPayload): Promise<any>;
}
export {};
