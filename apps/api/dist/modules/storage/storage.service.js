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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const node_http_handler_1 = require("@smithy/node-http-handler");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../shared/prisma/prisma.service");
let StorageService = StorageService_1 = class StorageService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(StorageService_1.name);
        this.s3Client = null;
        this.bucket = null;
        this.publicUrl = null;
        this.useR2 = false;
        this.localUploadPath = path.join(process.cwd(), 'uploads', 'pdfs');
        this.ensureLocalDirectory();
        const endpoint = this.configService.get('CLOUDFLARE_R2_ENDPOINT');
        const accessKeyId = this.configService.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
        this.bucket = this.configService.get('CLOUDFLARE_R2_BUCKET_NAME');
        this.publicUrl = this.configService.get('CLOUDFLARE_R2_PUBLIC_URL');
        const hasAllConfig = endpoint && accessKeyId && secretAccessKey && this.bucket && this.publicUrl;
        this.logger.log(`R2 Endpoint: ${endpoint}`);
        this.logger.log(`Use R2: ${!!hasAllConfig}`);
        if (hasAllConfig) {
            this.s3Client = new client_s3_1.S3Client({
                region: 'auto',
                endpoint,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                forcePathStyle: true,
                requestHandler: new node_http_handler_1.NodeHttpHandler({
                    connectionTimeout: 5000,
                    socketTimeout: 5000,
                }),
            });
            this.useR2 = true;
            this.logger.log('✅ R2 ATIVO');
            this.logger.log(`Bucket: ${this.bucket}`);
            this.logger.log(`Public URL: ${this.publicUrl}`);
        }
        else {
            this.logger.warn('⚠️ R2 NÃO CONFIGURADO — usando local');
        }
    }
    ensureLocalDirectory() {
        if (!fs.existsSync(this.localUploadPath)) {
            fs.mkdirSync(this.localUploadPath, { recursive: true });
            this.logger.log(`📁 Diretório criado: ${this.localUploadPath}`);
        }
    }
    async validateShareToken(token) {
        try {
            const share = await this.prisma.publicShare.findUnique({
                where: { token },
                select: { expiresAt: true, id: true }
            });
            if (!share)
                return false;
            if (share.expiresAt && new Date() > share.expiresAt)
                return false;
            return true;
        }
        catch (error) {
            this.logger.error('Erro ao validar token:', error);
            return false;
        }
    }
    async checkFileAccess(fileKey, tenantId) {
        if (!fileKey.includes(tenantId)) {
            this.logger.warn(`❌ Tentativa de acesso a arquivo de outro tenant: ${fileKey} por ${tenantId}`);
            return false;
        }
        return true;
    }
    async uploadPdf(buffer, key, tenantId) {
        if (!buffer || buffer.length === 0) {
            throw new common_1.InternalServerErrorException('Buffer inválido');
        }
        const sanitizedKey = this.sanitizeKey(key);
        if (tenantId && !sanitizedKey.includes(tenantId)) {
            throw new common_1.ForbiddenException('A chave do arquivo deve conter o tenantId');
        }
        const normalizedKey = sanitizedKey.toLowerCase().endsWith('.pdf')
            ? sanitizedKey
            : `${sanitizedKey}.pdf`;
        this.logger.log(`📦 KEY: ${normalizedKey}`);
        if (!this.useR2 || !this.s3Client || !this.bucket || !this.publicUrl) {
            this.logger.warn('⚠️ R2 OFF — salvando local');
            return this.uploadPdfLocal(buffer, normalizedKey);
        }
        try {
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: normalizedKey,
                Body: buffer,
                ContentType: 'application/pdf',
                Metadata: {
                    uploadedBy: tenantId || 'system',
                    uploadedAt: new Date().toISOString(),
                },
            }));
            const url = `${this.publicUrl}/${normalizedKey}`;
            this.logger.log(`✅ ENVIADO PARA R2`);
            this.logger.log(`🌍 URL: ${url}`);
            return url;
        }
        catch (error) {
            this.logger.error('❌ ERRO REAL R2:');
            this.logger.error(error);
            throw new common_1.InternalServerErrorException('Falha no upload para R2');
        }
    }
    async uploadPdfLocal(buffer, key) {
        const sanitizedKey = this.sanitizeKey(key);
        const localPath = path.join(this.localUploadPath, sanitizedKey);
        const resolvedPath = path.resolve(localPath);
        if (!resolvedPath.startsWith(path.resolve(this.localUploadPath))) {
            throw new common_1.ForbiddenException('Caminho de arquivo inválido');
        }
        const dir = path.dirname(localPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(localPath, buffer);
        const baseUrl = this.configService.get('API_URL') || 'http://localhost:3000';
        const cleanBaseUrl = baseUrl.replace(/\/api$/, '');
        const localUrl = `${cleanBaseUrl}/api/storage/${sanitizedKey}`;
        this.logger.log(`📁 SALVO LOCAL: ${localPath}`);
        return localUrl;
    }
    sanitizeKey(key) {
        let normalized = key.replace(/\.\./g, '');
        normalized = normalized.replace(/[;&|`$]/g, '');
        normalized = normalized.replace(/\/\/+/g, '/');
        if (normalized.startsWith('/')) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }
    getPublicUrl(key) {
        if (!this.publicUrl) {
            throw new common_1.InternalServerErrorException('Public URL não configurada');
        }
        const sanitizedKey = this.sanitizeKey(key);
        return `${this.publicUrl}/${sanitizedKey}`;
    }
    async getFile(key, tenantId) {
        if (tenantId && !(await this.checkFileAccess(key, tenantId))) {
            throw new common_1.ForbiddenException('Acesso não autorizado a este arquivo');
        }
        const sanitizedKey = this.sanitizeKey(key);
        if (this.useR2 && this.s3Client && this.bucket) {
            try {
                const response = await this.s3Client.send(new client_s3_1.GetObjectCommand({
                    Bucket: this.bucket,
                    Key: sanitizedKey,
                }));
                const stream = response.Body;
                return new Promise((resolve, reject) => {
                    const chunks = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            }
            catch (error) {
                this.logger.error(`❌ ERRO AO BUSCAR NO R2: ${sanitizedKey}`);
                throw new common_1.NotFoundException('Arquivo não encontrado no R2');
            }
        }
        const localPath = path.join(this.localUploadPath, sanitizedKey);
        const resolvedPath = path.resolve(localPath);
        if (!resolvedPath.startsWith(path.resolve(this.localUploadPath))) {
            throw new common_1.ForbiddenException('Caminho de arquivo inválido');
        }
        if (fs.existsSync(localPath)) {
            return fs.readFileSync(localPath);
        }
        throw new common_1.NotFoundException(`Arquivo não encontrado: ${sanitizedKey}`);
    }
    async deleteFile(key) {
        const sanitizedKey = this.sanitizeKey(key);
        if (this.useR2 && this.s3Client && this.bucket) {
            try {
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: sanitizedKey,
                }));
                this.logger.log(`🗑️ REMOVIDO R2: ${sanitizedKey}`);
            }
            catch (error) {
                this.logger.error(`❌ ERRO AO DELETAR: ${error.message}`);
            }
        }
        else {
            const localPath = path.join(this.localUploadPath, sanitizedKey);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
                this.logger.log(`🗑️ REMOVIDO LOCAL: ${localPath}`);
            }
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], StorageService);
//# sourceMappingURL=storage.service.js.map