import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Event } from 'src/interfaces/event.interface';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'ID do usuário' })
  id: number;

  @ApiProperty({ example: 'usuario@email.com', description: 'Email do usuário' })
  email: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome do usuário' })
  nome: string | null;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone do usuário', required: false })
  telefone?: string;

  @ApiProperty({ example: 'USER', description: 'Role do usuário', enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: 'https://imgur.com/', description: 'Imagem do perfil' })
  imagem: string | null;

  
}