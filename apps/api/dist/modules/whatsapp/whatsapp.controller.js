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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const session_guard_1 = require("../../auth/guards/session.guard");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const send_estimate_whatsapp_service_1 = require("./send-estimate-whatsapp.service");
const send_invoice_whatsapp_service_1 = require("./send-invoice-whatsapp.service");
let WhatsappController = class WhatsappController {
    constructor(sendEstimateWhatsapp, sendInvoiceWhatsapp) {
        this.sendEstimateWhatsapp = sendEstimateWhatsapp;
        this.sendInvoiceWhatsapp = sendInvoiceWhatsapp;
    }
    async sendEstimateLink(id, user) {
        const result = await this.sendEstimateWhatsapp.execute(Number(id));
        return result;
    }
    async sendInvoiceLink(id, user) {
        const result = await this.sendInvoiceWhatsapp.execute(Number(id));
        return result;
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Post)('estimate/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendEstimateLink", null);
__decorate([
    (0, common_1.Post)('invoice/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendInvoiceLink", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, common_1.Controller)('whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, session_guard_1.SessionGuard),
    __metadata("design:paramtypes", [send_estimate_whatsapp_service_1.SendEstimateWhatsappService,
        send_invoice_whatsapp_service_1.SendInvoiceWhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map