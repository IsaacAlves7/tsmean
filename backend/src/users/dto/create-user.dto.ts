import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome completo do usuário' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'maria@email.com', description: 'E-mail único do usuário' })
  @IsNotEmpty({ message: 'O e-mail não pode estar vazio' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha com mínimo de 8 caracteres' })
  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;
}
