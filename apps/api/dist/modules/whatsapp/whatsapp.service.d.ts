export declare class WhatsappService {
    private readonly logger;
    private formatPhoneNumber;
    generateWhatsAppLink(phoneNumber: string, message: string): string;
    generateEstimateMessage(estimate: any, shareUrl: string): string;
    generateInvoiceMessage(invoice: any, shareUrl: string): string;
    getShareLink(shareToken: string, type: 'estimate' | 'invoice'): string;
}
