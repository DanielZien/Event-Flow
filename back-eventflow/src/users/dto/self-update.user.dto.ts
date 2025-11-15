import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class SelfUpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: true, description: 'Status do usuário', required: false })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({ example: 'https://imgur.com/', description: 'Imagem do perfil', required: false })
  @IsOptional()
  @IsString()
  imagem?: string

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário', minLength: 6, required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @ApiProperty({ example: 'Ricardo Ferreira', description: 'Nome do usuário', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string
}