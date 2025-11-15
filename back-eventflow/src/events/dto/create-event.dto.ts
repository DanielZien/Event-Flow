import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({example: 'Titulo do evento', description: 'Titulo do evento'})
  @IsString()
  titulo: string;

  @ApiProperty({example: 'Descricao do evento', description: 'Descricao do evento'})
  @IsString()
  descricao: string;

  @ApiProperty({example: 'dd/mm/aaaa hh:mm', description: 'Data do evento'})
  @IsDateString()
  data: string;

  @ApiProperty({example: 'Localizacao do evento', description: 'Localizacao do evento'})
  @IsString()
  localizacao: string;

  @ApiProperty({example: '19:00', description: 'Horário de inicio do evento', required: true})
  @IsString()
  hora_inicio: string;

  @ApiProperty({example: 'Categoria do evento', description: 'Categoria do evento', required: true})
  @IsString()
  categoria: string;

  @ApiProperty({example: 'Imagem do evento', description: 'Imagem do evento', required: false})
  @IsString()
  imagem:string
  
  @ApiProperty({example: '20:00', description: 'Horário de finalização do evento', required: true})
  @IsString()
  hora_fim: string;

  @ApiProperty({example: '20', description: 'Preço do evento de entrada', required: true})
  @IsNumber()
  preco: number;
}