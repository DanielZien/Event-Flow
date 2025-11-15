import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@email.com', description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do usuário', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone do usuário', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ 
    example: 'USER', 
    description: 'Role do usuário', 
    enum: UserRole,
    default: UserRole.USER 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: './gallery/image.jpg', description: 'Imagem do perfil', required: false })
  @IsOptional()
  @IsString()
  imagem?: string
}