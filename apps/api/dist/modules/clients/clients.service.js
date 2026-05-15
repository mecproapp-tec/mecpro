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
var ClientsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const client_1 = require("@prisma/client");
let ClientsService = ClientsService_1 = class ClientsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ClientsService_1.name);
    }
    async create(tenantId, data) {
        try {
            if (!tenantId) {
                throw new common_1.BadRequestException('TenantId não informado');
            }
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
            });
            if (!tenant) {
                throw new common_1.BadRequestException('Tenant não encontrado');
            }
            return await this.prisma.client.create({
                data: {
                    tenantId,
                    name: data.name.trim(),
                    phone: data.phone.trim(),
                    vehicle: data.vehicle?.trim() || '',
                    plate: data.plate?.trim() || '',
                    document: data.document?.trim() || '',
                    address: data.address?.trim() || '',
                },
            });
        }
        catch (error) {
            this.logger.error('Erro ao criar cliente', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Erro ao criar cliente');
        }
    }
    async findAll(tenantId, page = 1, limit = 50) {
        if (!tenantId) {
            throw new common_1.BadRequestException('TenantId inválido');
        }
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
        const skip = (safePage - 1) * safeLimit;
        const [data, total] = await this.prisma.$transaction([
            this.prisma.client.findMany({
                where: { tenantId, deletedAt: null },
                skip,
                take: safeLimit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
        ]);
        return {
            data,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(total / safeLimit),
        };
    }
    async findOne(id, tenantId) {
        if (!tenantId) {
            throw new common_1.BadRequestException('TenantId inválido');
        }
        const client = await this.prisma.client.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
        if (!client) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return client;
    }
    async update(id, tenantId, data) {
        if (!tenantId) {
            throw new common_1.BadRequestException('TenantId inválido');
        }
        await this.findOne(id, tenantId);
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.phone !== undefined)
            updateData.phone = data.phone.trim();
        if (data.vehicle !== undefined)
            updateData.vehicle = data.vehicle.trim();
        if (data.plate !== undefined)
            updateData.plate = data.plate.trim();
        if (data.document !== undefined)
            updateData.document = data.document.trim();
        if (data.address !== undefined)
            updateData.address = data.address.trim();
        return this.prisma.client.update({
            where: { id },
            data: updateData,
        });
    }
    async remove(id, tenantId) {
        if (!tenantId) {
            throw new common_1.BadRequestException('TenantId inválido');
        }
        await this.findOne(id, tenantId);
        try {
            await this.prisma.client.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        }
        catch (error) {
            this.logger.error('Erro ao deletar cliente', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException('Cliente possui registros relacionados (agendamentos, orçamentos ou faturas).');
            }
            throw new common_1.InternalServerErrorException('Erro ao excluir cliente');
        }
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = ClientsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map