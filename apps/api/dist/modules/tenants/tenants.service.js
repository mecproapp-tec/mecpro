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
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
let TenantsService = TenantsService_1 = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TenantsService_1.name);
    }
    async getById(id) {
        this.logger.log(`Buscando tenant com ID: ${id}`);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                documentType: true,
                documentNumber: true,
                cep: true,
                address: true,
                number: true,
                complement: true,
                email: true,
                phone: true,
                logoUrl: true,
                status: true,
                trialEndsAt: true,
                createdAt: true,
                updatedAt: true,
                paymentStatus: true,
                subscriptionId: true,
                users: {
                    select: { id: true, name: true, email: true, role: true, createdAt: true },
                },
                subscriptions: {
                    select: { id: true, planName: true, price: true, status: true, startDate: true, endDate: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Oficina não encontrada');
        return tenant;
    }
    async update(id, data) {
        this.logger.log(`Atualizando tenant ${id} com dados:`, data);
        const updateData = {};
        if (data.nome !== undefined)
            updateData.name = data.nome;
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.documento !== undefined)
            updateData.documentNumber = data.documento;
        if (data.documentNumber !== undefined)
            updateData.documentNumber = data.documentNumber;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.telefone !== undefined)
            updateData.phone = data.telefone;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.logo !== undefined)
            updateData.logoUrl = data.logo;
        if (data.logoUrl !== undefined)
            updateData.logoUrl = data.logoUrl;
        if (data.tipoDocumento !== undefined)
            updateData.documentType = data.tipoDocumento;
        if (data.documentType !== undefined)
            updateData.documentType = data.documentType;
        if (data.endereco !== undefined)
            updateData.address = data.endereco;
        if (data.address !== undefined)
            updateData.address = data.address;
        if (data.numero !== undefined)
            updateData.number = data.numero;
        if (data.number !== undefined)
            updateData.number = data.number;
        if (data.complemento !== undefined)
            updateData.complement = data.complemento;
        if (data.complement !== undefined)
            updateData.complement = data.complement;
        if (data.cep !== undefined)
            updateData.cep = data.cep;
        const updated = await this.prisma.tenant.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                documentNumber: true,
                email: true,
                phone: true,
                logoUrl: true,
                address: true,
                number: true,
                complement: true,
                documentType: true,
                updatedAt: true,
            },
        });
        this.logger.log(`Tenant ${id} atualizado com sucesso`);
        return updated;
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map