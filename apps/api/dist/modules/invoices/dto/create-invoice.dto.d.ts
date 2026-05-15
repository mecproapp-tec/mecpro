export declare enum InvoiceStatusDto {
    PENDING = "PENDING",
    PAID = "PAID",
    CANCELED = "CANCELED"
}
declare class CreateInvoiceItemDto {
    description: string;
    quantity: number;
    price: number;
    issPercent?: number;
}
export declare class CreateInvoiceDto {
    clientId: number;
    status?: InvoiceStatusDto;
    items: CreateInvoiceItemDto[];
}
export {};
