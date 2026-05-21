import { Controller, Post, Get, Body, Req, UseGuards, UnauthorizedException, HttpCode, HttpStatus, BadRequestException, Param } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionGuard } from './guards/session.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Public } from './public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

interface UserPayload {
  id: number;
  tenantId: string;
  role: string;
  sessionToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() body: { name: string; email: string; password: string; tenantId: string }) {
    if (!body.tenantId) throw new BadRequestException('tenantId é obrigatório');
    return this.authService.signup(body);
  }

  @Public()
  @Post('register-tenant')
  async registerTenant(@Body() body: any) {
    return this.authService.registerTenant(body);
  }

  @Public()
  @Post('register-admin')
  async registerAdmin(@Body() body: RegisterAdminDto, @Req() req: Request) {
    return this.authService.requestAdminRegistration(body, req.ip || '', req.headers['user-agent'] || '');
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(body.email, body.password, req);
  }

  @UseGuards(JwtAuthGuard, SessionGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: UserPayload) {
    if (!user?.id) return { message: 'Logout realizado com sucesso' };
    return this.authService.logout(user.id, user.sessionToken);
  }

  @UseGuards(JwtAuthGuard, SessionGuard)
  @Get('me')
  async getMe(@CurrentUser() user: UserPayload) {
    const userData = await this.authService.getUserById(user.id);
    return { success: true, user: userData };
  }

  @Public()
  @Post('complete-registration')
  @HttpCode(HttpStatus.OK)
  async completeRegistration(@Body() body: { token: string; password: string }) {
    if (!body.token || !body.password) throw new BadRequestException('Token e senha são obrigatórios');
    return this.authService.completeRegistration(body.token, body.password);
  }

  @UseGuards(JwtAuthGuard, SessionGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('admin/approve/:id')
  async approveAdmin(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.authService.approveAdmin(Number(id), user.id);
  }

  @UseGuards(JwtAuthGuard, SessionGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post('admin/reject/:id')
  async rejectAdmin(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser() user: UserPayload) {
    return this.authService.rejectAdmin(Number(id), user.id, reason);
  }
}