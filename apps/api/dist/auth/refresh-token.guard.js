"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../shared/prisma/prisma.service");
let RefreshTokenGuard = class RefreshTokenGuard {
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = req.headers['authorization']?.replace('Bearer ', '');
        if (!token)
            throw new common_1.UnauthorizedException('Token ausente');
        try {
            const payload = this.jwtService.verify(token);
            const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
            if (isNaN(userId)) {
                throw new common_1.UnauthorizedException('ID de usuário inválido');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            if (!user)
                throw new common_1.UnauthorizedException('Usuário não encontrado');
            req.user = user;
            return true;
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Token inválido');
        }
    }
};
exports.RefreshTokenGuard = RefreshTokenGuard;
exports.RefreshTokenGuard = RefreshTokenGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService, prisma_service_1.PrismaService])
], RefreshTokenGuard);
//# sourceMappingURL=refresh-token.guard.js.map