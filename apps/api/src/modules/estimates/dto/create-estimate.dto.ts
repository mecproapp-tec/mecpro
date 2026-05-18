// apps/api/src/modules/estimates/dto/create-estimate.dto.ts
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

export enum EstimateStatusDto {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  CONVERTED = 'CONVERTED',
}

export enum PaymentMethodDto {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PIX = 'PIX',
}

export class CreateEstimateItemDto {
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

export class CreateEstimateDto {
  @Type(() => Number)
  @IsNumber()
  clientId: number;

  @IsOptional()
  @IsEnum(EstimateStatusDto)
  status?: EstimateStatusDto;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEstimateItemDto)
  items: CreateEstimateItemDto[];

  @IsOptional()
  @IsEnum(PaymentMethodDto)
  paymentMethod?: PaymentMethodDto;
}