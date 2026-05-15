import { PublicShareService } from './public-share.service';
import { Response } from 'express';
export declare class PublicShareController {
    private readonly service;
    constructor(service: PublicShareService);
    getEstimateByToken(token: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    getInvoiceByToken(token: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
}
