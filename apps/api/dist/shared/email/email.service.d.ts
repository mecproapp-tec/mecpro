export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    send(options: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void>;
    sendRegistrationEmail(email: string, token: string, officeName: string): Promise<void>;
    sendWelcomeEmail(email: string, name: string): Promise<void>;
    sendSubscriptionCanceledEmail(email: string, name: string): Promise<void>;
}
