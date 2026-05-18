export declare enum EstimateStatusDto {
    DRAFT = "DRAFT",
    SENT = "SENT",
    APPROVED = "APPROVED",
    CONVERTED = "CONVERTED"
}
export declare class CreateEstimateItemDto {
    description: string;
    quantity?: number;
    price: number;
    issPercent?: number;
}
export declare class CreateEstimateDto {
    clientId: number;
    status?: EstimateStatusDto;
    date?: string;
    items: CreateEstimateItemDto[];
}
