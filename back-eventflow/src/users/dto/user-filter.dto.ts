import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsNumber, Min } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';

export class UserFilterDto {
  @ApiProperty({ example: 'USER', description: 'Filtrar por role', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: true, description: 'Filtrar por status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  ativo?: boolean;

  @ApiProperty({ example: 1, description: 'Página', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ example: 10, description: 'Limite por página', required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}