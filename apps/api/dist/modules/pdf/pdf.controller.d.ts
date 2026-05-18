import { Response } from 'express';
export declare class PdfController {
    getPdf(filename: string, res: Response): Promise<void>;
}
