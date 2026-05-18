// apps/api/src/modules/invoices/dto/create-invoice.dto.ts
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum InvoiceStatusDto {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
}

export enum PaymentMethodDto {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PIX = 'PIX',
}

export class CreateInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  issPercent?: number;
}

export class CreateInvoiceDto {
  @Type(() => Number)
  @IsNumber()
  clientId: number;

  @IsOptional()
  @IsEnum(InvoiceStatusDto)
  status?: InvoiceStatusDto;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @IsOptional()
  @IsEnum(PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;
}