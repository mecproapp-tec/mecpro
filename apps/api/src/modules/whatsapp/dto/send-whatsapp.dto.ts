import { IsString, IsOptional, IsPhoneNumber, Length } from 'class-validator';

export class SendWhatsappDto {
  @IsString()
  @IsPhoneNumber('BR')
  phone: string;

  @IsString()
  @Length(1, 1000)
  message: string;

  @IsOptional()
  @IsString()
  pdfUrl?: string;
}