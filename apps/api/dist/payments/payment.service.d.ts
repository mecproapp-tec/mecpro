import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class PaymentService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private client;
    private preApproval;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    createSubscription(params: {
        email: string;
        externalReference: string;
        backUrl: string;
    }): Promise<{
        checkoutLink: string;
        preapprovalId: string;
    }>;
    getSubscription(preapprovalId: string): Promise<any>;
    cancelSubscription(preapprovalId: string): Promise<boolean>;
}
