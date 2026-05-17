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
exports.PublicShareService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const crypto_1 = require("crypto");
let PublicShareService = class PublicShareService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create({ tenantId, type, resourceId, expiresInDays = 7, }) {
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + expiresInDays * 86400000);
        return this.prisma.publicShare.create({
            data: { token, tenantId, type, resourceId, expiresAt },
        });
    }
    async findByToken(token) {
        const share = await this.prisma.publicShare.findUnique({ where: { token } });
        if (!share)
            throw new common_1.NotFoundException('Link inválido ou expirado');
        if (share.expiresAt && new Date() > share.expiresAt) {
            throw new common_1.UnauthorizedException('Link expirado');
        }
        return share;
    }
    async getPublicData(token) {
        const share = await this.findByToken(token);
        if (share.type === 'ESTIMATE') {
            const estimate = await this.prisma.estimate.findFirst({
                where: { id: share.resourceId, tenantId: share.tenantId },
                include: { client: true, items: true, tenant: true },
            });
            if (!estimate)
                throw new common_1.NotFoundException('Orçamento não encontrado');
            return {
                id: estimate.id,
                total: Number(estimate.total),
                date: estimate.date,
                status: estimate.status,
                client: {
                    id: estimate.client.id,
                    name: estimate.client.name,
                    phone: estimate.client.phone,
                    vehicle: estimate.client.vehicle,
                    plate: estimate.client.plate,
                    address: estimate.client.address || '',
                    document: estimate.client.document || '',
                },
                items: estimate.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: Number(item.price),
                    total: Number(item.total),
                    issPercent: item.issPercent ?? 0,
                })),
                tenant: {
                    name: estimate.tenant?.name ?? '',
                    documentNumber: estimate.tenant?.documentNumber ?? '',
                    phone: estimate.tenant?.phone ?? '',
                    email: estimate.tenant?.email ?? '',
                    logoUrl: estimate.tenant?.logoUrl ?? '',
                },
                pdfUrl: share.pdfUrl || estimate.pdfUrl || '',
            };
        }
        if (share.type === 'INVOICE') {
            const invoice = await this.prisma.invoice.findFirst({
                where: { id: share.resourceId, tenantId: share.tenantId },
                include: { client: true, items: true, tenant: true },
            });
            if (!invoice)
                throw new common_1.NotFoundException('Fatura não encontrada');
            return {
                id: invoice.id,
                number: invoice.number,
                total: Number(invoice.total),
                status: invoice.status,
                createdAt: invoice.createdAt,
                client: {
                    id: invoice.client.id,
                    name: invoice.client.name,
                    phone: invoice.client.phone,
                    vehicle: invoice.client.vehicle,
                    plate: invoice.client.plate,
                    address: invoice.client.address || '',
                    document: invoice.client.document || '',
                },
                items: invoice.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: Number(item.price),
                    total: Number(item.total),
                    issPercent: item.issPercent ?? 0,
                })),
                tenant: {
                    name: invoice.tenant?.name ?? '',
                    documentNumber: invoice.tenant?.documentNumber ?? '',
                    phone: invoice.tenant?.phone ?? '',
                    email: invoice.tenant?.email ?? '',
                    logoUrl: invoice.tenant?.logoUrl ?? '',
                },
                pdfUrl: share.pdfUrl || invoice.pdfUrl || '',
            };
        }
        throw new common_1.BadRequestException('Tipo de compartilhamento inválido');
    }
    async regenerate(token) {
        const share = await this.findByToken(token);
        const newToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const newShare = await this.prisma.publicShare.create({
            data: {
                token: newToken,
                tenantId: share.tenantId,
                type: share.type,
                resourceId: share.resourceId,
                expiresAt: new Date(Date.now() + 7 * 86400000),
            },
        });
        await this.prisma.publicShare.delete({ where: { id: share.id } });
        return newShare;
    }
    async delete(token) {
        const share = await this.findByToken(token);
        return this.prisma.publicShare.delete({ where: { id: share.id } });
    }
};
exports.PublicShareService = PublicShareService;
exports.PublicShareService = PublicShareService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicShareService);
//# sourceMappingURL=public-share.service.js.map