import { 
    Controller, 
    Get, 
    Put, 
    Delete, 
    Body, 
    Param, 
    UseGuards, 
    Request,
    ForbiddenException,
    NotFoundException
  } from '@nestjs/common';
  import { UsersService } from '../services/users.service';
  import { AuthGuard } from '@nestjs/passport';
  import { RolesGuard } from '../common/guards/roles.guard';
  import { Roles } from '../common/decorators/roles.decorator';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  
  @ApiTags('users')
  @Controller('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obter perfil do usuário logado' })
    @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    getProfile(@Request() req) {
      return this.usersService.findById(req.user.id);
    }
  
    @Get()
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar todos os usuários (apenas ADMIN)' })
    @ApiResponse({ status: 200, description: 'Usuários listados com sucesso' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    async findAll() {
      // Em uma implementação real, você pode querer paginação aqui
      return {
        statusCode: 200,
        message: 'Usuários listados com sucesso',
        data: await this.usersService.findAll(),
      };
    }
  
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obter usuário por ID' })
    @ApiResponse({ status: 200, description: 'Usuário encontrado' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async findOne(@Param('id') id: number, @Request() req) {
      // Usuários podem ver apenas seu próprio perfil, admins podem ver qualquer um
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        throw new ForbiddenException('Você só pode visualizar seu próprio perfil');
      }
  
      const user = await this.usersService.findById(id);
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }
  
      return {
        statusCode: 200,
        message: 'Usuário encontrado',
        data: user,
      };
    }
  
    @Put('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
    @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async updateProfile(@Body() updateUserDto: any, @Request() req) {
      const updatedUser = await this.usersService.update(req.user.id, updateUserDto);
      
      return {
        statusCode: 200,
        message: 'Perfil atualizado com sucesso',
        data: updatedUser,
      };
    }
  
    @Put(':id')
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Atualizar usuário (apenas ADMIN)' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async updateUser(@Param('id') id: number, @Body() updateUserDto: any) {
      const updatedUser = await this.usersService.update(id, updateUserDto);
      
      return {
        statusCode: 200,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser,
      };
    }
  
    @Delete(':id')
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Excluir usuário (apenas ADMIN)' })
    @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async remove(@Param('id') id: number) {
      await this.usersService.delete(id);
      
      return {
        statusCode: 200,
        message: 'Usuário excluído com sucesso',
      };
    }
  
    @Get(':id/events')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obter eventos criados por um usuário' })
    @ApiResponse({ status: 200, description: 'Eventos listados com sucesso' })
    @ApiResponse({ status: 403, description: 'Acesso negado' })
    async getUserEvents(@Param('id') id: number, @Request() req) {
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        throw new ForbiddenException('Você só pode visualizar seus próprios eventos');
      }
  
      const events = await this.usersService.getUserEvents(id);
      
      return {
        statusCode: 200,
        message: 'Eventos do usuário listados com sucesso',
        data: events,
      };
    }
  }