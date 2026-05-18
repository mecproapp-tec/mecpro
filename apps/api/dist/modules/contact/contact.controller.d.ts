import { ContactService } from './contact.service';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    sendContact(data: {
        userEmail?: string;
        userName?: string;
        message: string;
        tenantId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        id: number;
        receivedAt: Date;
    }>;
    getContacts(user: UserPayload): Promise<{
        tenant: {
            email: string;
            phone: string;
            id: string;
            name: string;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        message: string;
        userEmail: string;
        userName: string;
        reply: string;
    }[]>;
    replyToContact(id: string, body: {
        reply: string;
    }, user: UserPayload): Promise<{
        tenant: {
            email: string;
            phone: string;
            id: string;
            name: string;
        };
        id: number;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        message: string;
        userEmail: string;
        userName: string;
        reply: string;
    }>;
    deleteContact(id: string, user: UserPayload): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
