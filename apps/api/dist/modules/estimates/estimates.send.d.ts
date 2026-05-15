export declare class EstimatesSendService {
    private transporter;
    constructor();
    sendEstimateByEmail(to: string, estimate: any, pdfBuffer?: Buffer): Promise<any>;
    sendEstimateByWhatsApp(phone: string, estimateId: number): Promise<{
        url: string;
    }>;
}
