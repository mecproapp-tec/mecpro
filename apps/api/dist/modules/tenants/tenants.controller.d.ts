import { TenantsService } from './tenants.service';
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class TenantsController {
    private readonly tenantsService;
    private readonly logger;
    constructor(tenantsService: TenantsService);
    getMyTenant(user: UserPayload): Promise<{
        success: boolean;
        data: {
            nome: string;
            tipoDocumento: string;
            documento: string;
            endereco: string;
            numero: string;
            complemento: string;
            telefone: string;
            email: string;
            logo: string;
        };
    }>;
    updateMyTenant(data: any, user: UserPayload): Promise<{
        success: boolean;
        message: string;
        data: {
            nome: string;
            tipoDocumento: string;
            documento: string;
            endereco: string;
            numero: string;
            complemento: string;
            telefone: string;
            email: string;
            logo: string;
        };
    }>;
}
export {};
