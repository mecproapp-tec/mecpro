import { DashboardService } from "./dashboard.service";
interface UserPayload {
    id: number;
    tenantId: string;
    role: string;
    sessionToken: string;
}
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboard(user: UserPayload): Promise<{
        clients: number;
        estimates: number;
        invoices: number;
        tenantId: string;
    }>;
}
export {};
