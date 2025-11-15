import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegistroDto } from '../auth/dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Credenciais inválidas',
      };
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async register(@Body() registerDto: RegistroDto) {
    try {
      const result = await this.authService.registrar(registerDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Usuário criado com sucesso',
        ...result,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('já cadastrado')) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: error.message,
        };
      }
      throw error;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  @ApiResponse({ status: 200, description: 'Perfil retornado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  getProfile(@Request() req) {
    return {
      statusCode: HttpStatus.OK,
      data: req.user,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('refresh')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token atualizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  async refreshToken(@Request() req) {
    const payload = {
      email: req.user.email,
      sub: req.user.id,
      role: req.user.role,
    };
    
    return {
      statusCode: HttpStatus.OK,
      access_token: this.authService['jwtService'].sign(payload),
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}
