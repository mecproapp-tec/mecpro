import { IsEmail, IsString, MinLength, IsNumber } from 'class-validator';
export class RegisterDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  password: string;
  @IsNumber()
  tenantId: number;
}
