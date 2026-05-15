import { Type } from 'class-transformer';
import { ValidateNested, IsString, IsNumber, IsOptional, IsArray, IsNotEmpty, IsEnum } from 'class-validator';

// 🔥 BUG #56 CORRIGIDO: Definir enum para status
export enum InvoiceStatusDto {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
}

class CreateInvoiceItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  issPercent?: number;
}

export class CreateInvoiceDto {
  @IsNumber()
  clientId: number;

  // 🔥 BUG #56 CORRIGIDO: Usar enum em vez de string livre
  @IsOptional()
  @IsEnum(InvoiceStatusDto)
  status?: InvoiceStatusDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}