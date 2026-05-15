"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, userRole) {
        const where = {};
        if (userRole !== 'SUPER_ADMIN') {
            where.tenantId = tenantId;
        }
        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, tenantId, userRole) {
        const where = { id };
        if (userRole !== 'SUPER_ADMIN') {
            where.tenantId = tenantId;
        }
        const user = await this.prisma.user.findFirst({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        return user;
    }
    async update(id, tenantId, data, userRole, currentUserId) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, tenantId: true },
        });
        if (!targetUser)
            throw new common_1.NotFoundException('Usuário não encontrado');
        if (userRole === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Não é permitido modificar um administrador global');
        }
        if (userRole === 'ADMIN' && targetUser.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Não é permitido modificar usuários de outras oficinas');
        }
        if (currentUserId && targetUser.id === currentUserId && (data.role || data.tenantId)) {
            throw new common_1.ForbiddenException('Não é permitido alterar seu próprio papel ou tenant');
        }
        await this.findOne(id, tenantId, userRole);
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                updatedAt: true,
            },
        });
    }
    async remove(id, tenantId, userRole, currentUserId) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, tenantId: true },
        });
        if (!targetUser)
            throw new common_1.NotFoundException('Usuário não encontrado');
        if (userRole === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Não é permitido remover um administrador global');
        }
        if (userRole === 'ADMIN' && targetUser.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Não é permitido remover usuários de outras oficinas');
        }
        if (currentUserId && targetUser.id === currentUserId) {
            throw new common_1.ForbiddenException('Não é permitido remover seu próprio usuário');
        }
        await this.findOne(id, tenantId, userRole);
        await this.prisma.user.delete({ where: { id } });
        return { message: 'Usuário removido com sucesso' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map