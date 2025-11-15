import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'senhaAntiga123', description: 'Senha atual' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    example: 'novaSenha123', 
    description: 'Nova senha (mínimo 6 caracteres)',
    minLength: 6 
  })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
  })
  newPassword: string;
}