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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TenantsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const session_guard_1 = require("../../auth/guards/session.guard");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const tenants_service_1 = require("./tenants.service");
let TenantsController = TenantsController_1 = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
        this.logger = new common_1.Logger(TenantsController_1.name);
    }
    async getMyTenant(user) {
        const tenant = await this.tenantsService.getById(user.tenantId);
        this.logger.log(`GET /me - complement = "${tenant.complement}"`);
        return {
            success: true,
            data: {
                nome: tenant.name,
                tipoDocumento: tenant.documentType,
                documento: tenant.documentNumber,
                endereco: tenant.address,
                numero: tenant.number || '',
                complemento: tenant.complement || '',
                telefone: tenant.phone,
                email: tenant.email,
                logo: tenant.logoUrl,
            },
        };
    }
    async updateMyTenant(data, user) {
        this.logger.log(`PUT /me - recebido complemento = "${data.complemento}"`);
        if (!data.nome && !data.documento && !data.email && !data.telefone && !data.endereco && !data.numero && !data.logo) {
            throw new common_1.BadRequestException('Nenhum dado para atualizar');
        }
        const updated = await this.tenantsService.update(user.tenantId, data);
        this.logger.log(`PUT /me - após update, complement = "${updated.complement}"`);
        return {
            success: true,
            message: 'Dados da oficina atualizados com sucesso',
            data: {
                nome: updated.name,
                tipoDocumento: updated.documentType,
                documento: updated.documentNumber,
                endereco: updated.address,
                numero: updated.number || '',
                complemento: updated.complement || '',
                telefone: updated.phone,
                email: updated.email,
                logo: updated.logoUrl,
            },
        };
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getMyTenant", null);
__decorate([
    (0, common_1.Put)('me'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateMyTenant", null);
exports.TenantsController = TenantsController = TenantsController_1 = __decorate([
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, session_guard_1.SessionGuard),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map