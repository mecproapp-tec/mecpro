export declare class InvoicesPdfService {
    private readonly logger;
    private templateCache;
    private getBrowser;
    private loadTemplate;
    generateInvoicePdf(invoice: any): Promise<Buffer>;
}
