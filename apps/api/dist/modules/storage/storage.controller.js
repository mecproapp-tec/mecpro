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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageController = void 0;
const common_1 = require("@nestjs/common");
const storage_service_1 = require("./storage.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../../auth/public.decorator");
const path = __importStar(require("path"));
let StorageController = class StorageController {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async getSharedFile(token, filename, res) {
        const share = await this.storageService.validateShareToken(token);
        if (!share) {
            throw new common_1.NotFoundException('Link inválido ou expirado');
        }
        return this.serveFile(filename, res);
    }
    async getFile(filePath, res, req) {
        const sanitizedPath = this.sanitizeFilePath(filePath);
        const user = req.user;
        if (!user || !user.tenantId) {
            throw new common_1.NotFoundException('Acesso não autorizado');
        }
        if (!sanitizedPath.includes(user.tenantId)) {
            console.error(`❌ Tentativa de acesso a arquivo de outro tenant: ${sanitizedPath} por user ${user.id}`);
            throw new common_1.NotFoundException('Acesso negado');
        }
        return this.serveFile(sanitizedPath, res);
    }
    async serveFile(filePath, res) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
            if (!allowedExtensions.includes(ext)) {
                throw new common_1.NotFoundException('Tipo de arquivo não permitido');
            }
            const fileBuffer = await this.storageService.getFile(filePath);
            let contentType = 'application/octet-stream';
            if (ext === '.pdf')
                contentType = 'application/pdf';
            else if (ext === '.png')
                contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg')
                contentType = 'image/jpeg';
            else if (ext === '.gif')
                contentType = 'image/gif';
            else if (ext === '.webp')
                contentType = 'image/webp';
            res.set({
                'Content-Type': contentType,
                'Content-Disposition': 'inline',
                'X-Content-Type-Options': 'nosniff',
            });
            return res.send(fileBuffer);
        }
        catch (error) {
            console.error(`❌ Erro ao servir arquivo ${filePath}:`, error.message);
            throw new common_1.NotFoundException('Arquivo não encontrado');
        }
    }
    sanitizeFilePath(filePath) {
        let normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
        normalized = normalized.replace(/[;&|`$]/g, '');
        const parts = normalized.split(/[\/\\]/);
        const safeParts = parts.filter(part => part !== '..' && part !== '.');
        return safeParts.join('/');
    }
};
exports.StorageController = StorageController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('share/:token/:filename'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getSharedFile", null);
__decorate([
    (0, common_1.Get)('*'),
    __param(0, (0, common_1.Param)('0')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StorageController.prototype, "getFile", null);
exports.StorageController = StorageController = __decorate([
    (0, common_1.Controller)('storage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageController);
//# sourceMappingURL=storage.controller.js.map