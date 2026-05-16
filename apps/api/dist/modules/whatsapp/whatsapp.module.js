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
const storage_module_1 = require("../storage/storage.module");
const estimates_pdf_service_1 = require("../estimates/estimates-pdf.service");
const invoices_pdf_service_1 = require("../invoices/invoices-pdf.service");
const prisma_module_1 = require("../../shared/prisma/prisma.module");
let WhatsappModule = class WhatsappModule {
};
exports.WhatsappModule = WhatsappModule;
exports.WhatsappModule = WhatsappModule = __decorate([
    (0, common_1.Module)({
        imports: [storage_module_1.StorageModule, prisma_module_1.PrismaModule],
        providers: [
            whatsapp_service_1.WhatsappService,
            send_estimate_whatsapp_service_1.SendEstimateWhatsappService,
            estimates_pdf_service_1.EstimatesPdfService,
            invoices_pdf_service_1.InvoicesPdfService,
        ],
        controllers: [whatsapp_controller_1.WhatsappController],
        exports: [whatsapp_service_1.WhatsappService, send_estimate_whatsapp_service_1.SendEstimateWhatsappService],
    })
], WhatsappModule);
//# sourceMappingURL=whatsapp.module.js.map