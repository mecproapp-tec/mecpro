import { StorageService } from '../storage/storage.service';
export declare class InvoicesPdfService {
    private readonly storageService;
    private readonly logger;
    private templateCache;
    constructor(storageService: StorageService);
    private getBrowser;
    private loadTemplate;
    generateInvoicePdf(invoice: any): Promise<Buffer>;
}
