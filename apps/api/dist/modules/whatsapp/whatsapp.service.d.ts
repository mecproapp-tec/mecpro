export declare class WhatsappService {
    private readonly logger;
    private formatPhone;
    generateWhatsAppLink(phoneNumber: string, message: string): string;
    sendInvoice(invoice: any, shareUrl: string): Promise<{
        success: boolean;
        whatsappUrl: string;
        message: string;
    }>;
    sendEstimate(estimate: any, shareUrl: string): Promise<{
        success: boolean;
        whatsappUrl: string;
        message: string;
    }>;
}
