import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  clientId: number;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  comment?: string;
}