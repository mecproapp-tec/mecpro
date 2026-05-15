"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor() {
        this.logger = new common_1.Logger(WhatsappService_1.name);
    }
    formatPhone(phoneNumber) {
        return phoneNumber.replace(/\D/g, '');
    }
    generateWhatsAppLink(phoneNumber, message) {
        const cleanPhone = this.formatPhone(phoneNumber);
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
    }
    async sendInvoice(invoice, shareUrl) {
        const message = `📄 *FATURA MECPRO #${invoice.number}*
👤 *Cliente:* ${invoice.client?.name || '-'}
🚗 *Veículo:* ${invoice.client?.vehicle || '-'}
💰 *Total:* R$ ${Number(invoice.total).toFixed(2)}
🔗 *Link:* ${shareUrl}

MecPro - Gestão para Oficinas`;
        const link = this.generateWhatsAppLink(invoice.client.phone, message);
        this.logger.log(`📲 Fatura enviada ${invoice.id}`);
        return { success: true, whatsappUrl: link, message };
    }
    async sendEstimate(estimate, shareUrl) {
        const message = `📄 *ORÇAMENTO MECPRO #${estimate.id}*
👤 *Cliente:* ${estimate.client?.name || '-'}
🚗 *Veículo:* ${estimate.client?.vehicle || '-'}
💰 *Total:* R$ ${Number(estimate.total).toFixed(2)}
🔗 *Link:* ${shareUrl}

MecPro - Sua oficina de confiança`;
        const link = this.generateWhatsAppLink(estimate.client.phone, message);
        this.logger.log(`📲 Orçamento enviado ${estimate.id}`);
        return { success: true, whatsappUrl: link, message };
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map