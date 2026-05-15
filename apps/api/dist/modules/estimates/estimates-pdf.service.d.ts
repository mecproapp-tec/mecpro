export declare class EstimatesPdfService {
    private readonly logger;
    private templateCache;
    private getBrowser;
    private loadTemplate;
    generateEstimatePdf(estimate: any): Promise<Buffer>;
}
