interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class WhatsappController {
    generateWhatsAppLink(body: {
        phoneNumber: string;
        message: string;
    }, user: UserPayload): Promise<{
        success: boolean;
        whatsappUrl: string;
        message: string;
        tenantId: string;
    }>;
}
export {};
