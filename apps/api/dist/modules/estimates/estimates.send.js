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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimatesSendService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let EstimatesSendService = class EstimatesSendService {
    constructor() {
        const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
        const emailPort = parseInt(process.env.EMAIL_PORT ?? '587', 10);
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        this.transporter = nodemailer.createTransport({
            host: emailHost,
            port: emailPort,
            secure: emailPort === 465,
            auth: { user: emailUser, pass: emailPass },
        });
    }
    async sendEstimateByEmail(to, estimate, pdfBuffer) {
        const mailOptions = {
            from: `"MecPro" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Orçamento #${estimate.id}`,
            html: `
        <h1>Orçamento #${estimate.id}</h1>
        <p><strong>Cliente:</strong> ${estimate.clientId?.name || 'N/A'}</p>
        <p><strong>Data:</strong> ${new Date(estimate.date).toLocaleDateString('pt-BR')}</p>
        <p><strong>Total:</strong> R$ ${estimate.total.toFixed(2)}</p>
        <p><strong>Status:</strong> ${estimate.status}</p>
        <p>Segue em anexo o orçamento em PDF.</p>
      `,
            attachments: pdfBuffer ? [{ filename: `orcamento-${estimate.id}.pdf`, content: pdfBuffer }] : [],
        };
        return this.transporter.sendMail(mailOptions);
    }
    async sendEstimateByWhatsApp(phone, estimateId) {
        const message = encodeURIComponent(`Olá, segue o orçamento #${estimateId} do MecPro.`);
        const url = `https://wa.me/${phone}?text=${message}`;
        return { url };
    }
};
exports.EstimatesSendService = EstimatesSendService;
exports.EstimatesSendService = EstimatesSendService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EstimatesSendService);
//# sourceMappingURL=estimates.send.js.map