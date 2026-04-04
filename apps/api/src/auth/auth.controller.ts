import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RegisterAdminDto } from './dto/register-admin.dto';

// ✅ TIPAGEM GLOBAL DO REQUEST
interface AuthRequest extends Request {
  user: {
    id: number;
    sessionToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      tenantId: string;
    },
  ) {
    return this.authService.signup(body);
  }

  @Post('register-tenant')
  async registerTenant(
    @Body()
    body: {
      officeName: string;
      documentType: string;
      documentNumber: string;
      cep: string;
      address: string;
      email: string;
      phone: string;
      ownerName: string;
      password: string;
      paymentCompleted: boolean;
      preapprovalId?: string;
    },
  ) {
    return this.authService.registerTenant(body);
  }

  @Post('register-admin')
  async registerAdmin(@Body() body: RegisterAdminDto) {
    return this.authService.registerAdmin(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(body.email, body.password, req);
  }

@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(@Req() req: any) {
  const user = req.user;

  return this.authService.logout(user.id, user.sessionToken);
}
}