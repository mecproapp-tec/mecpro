"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappModule = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const whatsapp_controller_1 = require("./whatsapp.controller");
const send_estimate_whatsapp_service_1 = require("./send-estimate-whatsapp.service");
const send_invoice_whatsapp_service_1 = require("./send-invoice-whatsapp.service");
const prisma_module_1 = require("../../shared/prisma/prisma.module");
const public_share_module_1 = require("../public-share/public-share.module");
let WhatsappModule = class WhatsappModule {
};
exports.WhatsappModule = WhatsappModule;
exports.WhatsappModule = WhatsappModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, public_share_module_1.PublicShareModule],
        providers: [whatsapp_service_1.WhatsappService, send_estimate_whatsapp_service_1.SendEstimateWhatsappService, send_invoice_whatsapp_service_1.SendInvoiceWhatsappService],
        controllers: [whatsapp_controller_1.WhatsappController],
        exports: [send_estimate_whatsapp_service_1.SendEstimateWhatsappService, send_invoice_whatsapp_service_1.SendInvoiceWhatsappService],
    })
], WhatsappModule);
//# sourceMappingURL=whatsapp.module.js.map