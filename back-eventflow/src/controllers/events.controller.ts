import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request
} from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { CreateEventDto } from '../events/dto/create-event.dto';
import { UpdateEventDto } from '../events/dto/update-event.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo evento' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os eventos' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'id', required: false, type: Number })
  @ApiQuery({ name: 'titulo', required: false, type: String })
  @ApiQuery({ name: 'data', required: false, type: Date })
  @ApiQuery({ name: 'localizacao', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoria', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Eventos listados com sucesso' })
  findAll(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('id') id?: number,
    @Query('titulo') titulo?: string,
    @Query('data') data?: Date,
    @Query('localizacao') localizacao?: string,
    @Query('status') status?: string,
    @Query('categoria') categoria?: string
  ) {
    const filters = {
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      id: id ? Number(id) : undefined,
      titulo: titulo ? titulo : undefined,
      data: data ? new Date(data) : undefined,
      localizacao: localizacao ? localizacao : undefined,
      status: status ? status : undefined,
      categoria: categoria ? categoria : undefined
    };

    return this.eventsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um evento específico' })
  @ApiResponse({ status: 200, description: 'Evento encontrado' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  findOne(@Param('id') id: number) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um evento' })
  @ApiResponse({ status: 200, description: 'Evento atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para editar este evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  update(@Param('id') id: number, @Body() updateEventDto: UpdateEventDto, @Request() req) {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um evento' })
  @ApiResponse({ status: 200, description: 'Evento removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir este evento' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado' })
  remove(@Param('id') id: number, @Request() req) {
    return this.eventsService.remove(id, req.user.id);
  }
}