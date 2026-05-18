import { StorageService } from '../storage/storage.service';
export declare class EstimatesPdfService {
    private readonly storageService;
    private readonly logger;
    private templateCache;
    constructor(storageService: StorageService);
    private getBrowser;
    private loadTemplate;
    generateEstimatePdf(estimate: any): Promise<Buffer>;
}
