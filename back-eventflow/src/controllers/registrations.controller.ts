import { Controller, Post, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { RegistrationsService } from '../services/registrations.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('registrations')
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('event/:eventId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inscrever-se em um evento' })
  @ApiResponse({ status: 201, description: 'Inscrição realizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  @ApiResponse({ status: 409, description: 'Já inscrito neste evento ou vagas esgotadas' })
  registerForEvent(@Param('eventId') eventId: number, @Request() req) {
    return this.registrationsService.registerForEvent(eventId, req.user.id);
  }

  @Get('my-registrations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar minhas inscrições' })
  @ApiResponse({ status: 200, description: 'Inscrições listadas com sucesso' })
  getMyRegistrations(@Request() req) {
    return this.registrationsService.getUserRegistrations(req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar inscrição em um evento' })
  @ApiResponse({ status: 200, description: 'Inscrição cancelada com sucesso' })
  @ApiResponse({ status: 404, description: 'Inscrição não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para cancelar esta inscrição' })
  cancelRegistration(@Param('id') id: string, @Request() req) {
    return this.registrationsService.cancelRegistration(id, req.user.id);
  }
}