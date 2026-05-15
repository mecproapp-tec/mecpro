import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateClientDto {
  @IsString({ message: 'Nome deve ser texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsString({ message: 'Telefone deve ser texto' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Telefone deve ter 10 ou 11 dígitos' })
  phone: string;

  @IsString({ message: 'Veículo deve ser texto' })
  @IsOptional()
  vehicle?: string;

  @IsString({ message: 'Placa deve ser texto' })
  @IsOptional()
  @Matches(/^[A-Za-z]{3}[0-9]{4}$|^[A-Za-z]{3}[0-9]{1}[A-Za-z]{1}[0-9]{2}$/, {
    message: 'Placa deve estar no formato antigo (ABC1234) ou Mercosul (ABC1D23)',
  })
  plate?: string;

  @IsString({ message: 'Documento deve ser texto' })
  @IsOptional()
  document?: string;

  @IsString({ message: 'Endereço deve ser texto' })
  @IsOptional()
  address?: string;
}