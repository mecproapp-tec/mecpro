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
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('55') && cleaned.length === 13)
            return cleaned;
        if (cleaned.length === 11)
            return `55${cleaned}`;
        if (cleaned.length === 10)
            return `55${cleaned}`;
        return cleaned;
    }
    generateWhatsAppLink(phoneNumber, message) {
        const cleanPhone = this.formatPhoneNumber(phoneNumber);
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    }
    generateEstimateMessage(estimate, shareUrl) {
        return `📄 *ORÇAMENTO MECPRO #${estimate.id}*
👤 Cliente: ${estimate.client.name}
🚗 Veículo: ${estimate.client.vehicle || '-'}
💰 Total: R$ ${Number(estimate.total).toFixed(2)}
🔗 Link: ${shareUrl}

MecPro - Gestão para Oficinas`;
    }
    generateInvoiceMessage(invoice, shareUrl) {
        return `📄 *FATURA MECPRO #${invoice.number}*
👤 Cliente: ${invoice.client.name}
🚗 Veículo: ${invoice.client.vehicle || '-'}
💰 Total: R$ ${Number(invoice.total).toFixed(2)}
🔗 Link: ${shareUrl}

MecPro - Sua oficina de confiança`;
    }
    getShareLink(shareToken, type) {
        const baseUrl = process.env.APP_URL || 'https://api.mecpro.tec.br';
        return `${baseUrl}/api/public/${type}s/share/${shareToken}`;
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map