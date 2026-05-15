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

// 🔥 BUG #55 CORRIGIDO: Definir enum para status
export enum EstimateStatusDto {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  CONVERTED = 'CONVERTED',
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

  // 🔥 BUG #55 CORRIGIDO: Usar enum em vez de string livre
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
}