export declare class PdfService {
    private readonly logger;
    generateInvoicePdf(invoice: any): Promise<Buffer>;
    generateEstimatePdf(estimate: any): Promise<Buffer>;
    private generateDocument;
}
