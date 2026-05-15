// apps/api/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
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

    const ADMIN_TENANT_ID = '00000000-0000-0000-0000-000000000001';
    let tenant = await this.prisma.tenant.findUnique({
      where: { id: ADMIN_TENANT_ID },
    });
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: {
          id: ADMIN_TENANT_ID,
          name: 'Administração',
          documentType: 'ADMIN',
          documentNumber: '00000000000000',
          cep: '00000000',
          address: 'Sistema',
          email: 'admin@mecpro.com',
          phone: '0000000000',
          status: 'ACTIVE',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });

    return {
      message: 'Administrador cadastrado com sucesso',
      user,
    };
  }

  async login(email: string, password: string, req: Request) {
    try {
      this.logger.log(`Tentativa de login para ${email}`);

      const user = await this.prisma.user.findFirst({
        where: { email },
        include: { tenant: true },
      });

      if (!user) {
        this.logger.warn(`Usuário não encontrado: ${email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        this.logger.warn(`Senha inválida para ${email}`);
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (!user.tenantId) {
        this.logger.warn(`Usuário ${email} sem tenant`);
        throw new UnauthorizedException('Usuário sem tenant');
      }

      if (user.status === 'BLOCKED') {
        this.logger.warn(`Usuário bloqueado: ${email}`);
        throw new UnauthorizedException('Usuário bloqueado. Contate o suporte.');
      }

      if (!user.tenant || user.tenant.status !== 'ACTIVE') {
        this.logger.warn(`Tenant bloqueado/cancelado para ${email}`);
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

      this.logger.log(`Login bem-sucedido: ${email}`);
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
    } catch (error) {
      this.logger.error(`Erro no login para ${email}: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro interno ao processar login. Verifique os logs.');
    }
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
    if (!user.tenant || user.tenant.status !== 'ACTIVE') {
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
}