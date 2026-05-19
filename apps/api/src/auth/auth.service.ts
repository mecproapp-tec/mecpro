import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PaymentService } from '../payments/payment.service';
import { Request } from 'express';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { randomUUID, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private paymentService: PaymentService,
  ) {}

  async signup(data: {
    name: string;
    email: string;
    password: string;
    tenantId: string;
  }) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        tenantId: data.tenantId,
        status: 'ACTIVE',
      },
    });
    return user;
  }

  async registerTenant(data: {
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
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) throw new BadRequestException('Email já cadastrado');

    const existingTenant = await this.prisma.tenant.findFirst({
      where: { documentNumber: data.documentNumber },
    });
    if (existingTenant) throw new BadRequestException('Documento já cadastrado');

    if (!data.preapprovalId) {
      throw new BadRequestException('ID da assinatura não fornecido.');
    }

    const subscriptionData = await this.paymentService.getSubscription(
      data.preapprovalId,
    );
    if (subscriptionData.status !== 'authorized') {
      throw new BadRequestException('Assinatura não autorizada ou pendente.');
    }

    const trialEndsAt = new Date(subscriptionData.next_payment_date);

    const tenant = await this.prisma.tenant.create({
      data: {
        id: randomUUID(),
        name: data.officeName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        cep: data.cep,
        address: data.address,
        email: data.email,
        phone: data.phone,
        status: 'ACTIVE',
        trialEndsAt,
        subscriptionId: data.preapprovalId,
        paymentStatus: 'TRIAL',
      },
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.ownerName,
        email: data.email,
        password: hashedPassword,
        role: 'OWNER',
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });

    const sessionToken = this.generateSessionToken();
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        ipAddress: '',
        userAgent: 'system',
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      sessionToken,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenPlain = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      message: 'Cadastro realizado com sucesso',
      accessToken,
      refreshToken: refreshTokenPlain,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        officeName: tenant.name,
      },
    };
  }

  async registerAdmin(data: RegisterAdminDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });
    if (existingUser) throw new BadRequestException('Email já cadastrado');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: null,
        status: 'ACTIVE',
      },
    });

    return {
      message: 'Administrador global cadastrado com sucesso',
      user,
    };
  }

  async login(email: string, password: string, req: Request) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    if (!user.tenantId && user.role !== 'ADMIN') {
      throw new UnauthorizedException('Usuário sem tenant');
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Usuário bloqueado. Contate o suporte.');
    }

    if (user.tenantId && (!user.tenant || user.tenant.status !== 'ACTIVE')) {
      this.logger.warn(`Tentativa de login para tenant bloqueado/cancelado: ${email}`);
      throw new UnauthorizedException('Sua conta da oficina foi bloqueada ou cancelada. Entre em contato com o suporte.');
    }

    await this.prisma.userSession.deleteMany({
      where: { userId: user.id },
    });

    const sessionToken = this.generateSessionToken();
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      sessionToken,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenPlain = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);

    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        officeName: user.tenant?.name || null,
        role: user.role,
      },
    };
  }

  async superAdminLogin(email: string, password: string) {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });
    if (!superAdmin) throw new UnauthorizedException('Credenciais inválidas');
    const valid = await bcrypt.compare(password, superAdmin.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');
    const payload = {
      sub: `sa_${superAdmin.id}`,
      email: superAdmin.email,
      isSuperAdmin: true,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN',
      },
    };
  }

  async logout(userId: number, sessionToken: string) {
    await this.prisma.userSession.deleteMany({
      where: { userId, sessionToken },
    });
    await this.prisma.refreshToken.deleteMany({
      where: { userId, sessionToken },
    });
    return { message: 'Logout realizado com sucesso' };
  }

  async refreshToken(refreshTokenPlain: string, sessionToken?: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('Session token não fornecido');
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { sessionToken },
      include: { user: { include: { tenant: true } } },
    });

    if (!stored) throw new UnauthorizedException('Refresh token inválido');
    const isValid = await bcrypt.compare(refreshTokenPlain, stored.tokenHash);
    if (!isValid) throw new UnauthorizedException('Refresh token inválido');

    const user = stored.user;
    const session = await this.prisma.userSession.findFirst({
      where: { userId: user.id, sessionToken },
    });
    if (!session) throw new UnauthorizedException('Sessão não encontrada');

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário bloqueado');
    }
    if (user.tenantId && (!user.tenant || user.tenant.status !== 'ACTIVE')) {
      throw new UnauthorizedException('Sua conta da oficina foi bloqueada ou cancelada');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      sessionToken,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        status: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            status: true,
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
      officeName: user.tenant?.name || null,
      logoUrl: user.tenant?.logoUrl || null,
      tenantStatus: user.tenant?.status || null,
    };
  }

  async completeRegistration(token: string, password: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        registrationToken: token,
        registrationTokenExpiresAt: { gt: new Date() },
      },
    });
    if (!tenant) {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { email: tenant.email },
      data: { password: hashedPassword },
    });

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { registrationToken: null, registrationTokenExpiresAt: null },
    });

    return { success: true, message: 'Senha definida com sucesso! Agora faça login.' };
  }
}