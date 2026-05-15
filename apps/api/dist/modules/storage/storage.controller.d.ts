import { Response, Request } from 'express';
import { StorageService } from './storage.service';
export declare class StorageController {
    private readonly storageService;
    constructor(storageService: StorageService);
    getSharedFile(token: string, filename: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getFile(filePath: string, res: Response, req: Request): Promise<Response<any, Record<string, any>>>;
    private serveFile;
    private sanitizeFilePath;
}
