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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (!host || !user || !pass) {
            this.logger.warn('SMTP não configurado. Emails não serão enviados.');
            return;
        }
        this.transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: user,
                pass: pass,
            },
        });
    }
    async send(options) {
        if (!this.transporter) {
            this.logger.error('SMTP não configurado');
            throw new Error('SMTP não configurado');
        }
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            this.logger.log(`Email enviado para ${options.to}`);
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email: ${error.message}`);
            throw error;
        }
    }
    async sendRegistrationEmail(email, token, officeName) {
        const appUrl = process.env.APP_URL || 'https://mecpro.tec.br';
        const registrationLink = `${appUrl}/finalizar-cadastro/${token}`;
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagamento Confirmado</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #00e5ff, #0077ff); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .price { font-size: 36px; font-weight: bold; color: #00e5ff; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #00e5ff, #0077ff); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MecPro</h1>
            <p style="color: #ffffff; margin: 10px 0 0;">Sistema para Oficinas Mecânicas</p>
          </div>
          <div class="content">
            <h2 style="color: #333;">Pagamento Confirmado! 🎉</h2>
            <p>Olá,</p>
            <p>Seu pagamento de <strong>R$ 149,90</strong> foi aprovado com sucesso.</p>
            <p>Para acessar a plataforma <strong>${officeName}</strong>, clique no link abaixo e finalize seu cadastro:</p>
            <div style="text-align: center;">
              <a href="${registrationLink}" class="button">Finalizar Cadastro</a>
            </div>
            <p>Ou copie o link abaixo:</p>
            <p style="word-break: break-all; background-color: #f4f4f4; padding: 12px; border-radius: 6px; color: #666; font-size: 12px;">${registrationLink}</p>
            <p><strong>⚠️ Este link expira em 7 dias.</strong></p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">Se você não realizou este pagamento, ignore este email.</p>
          </div>
          <div class="footer">
            <p>MecPro - Sistema para Oficinas Mecânicas</p>
            <p>© ${new Date().getFullYear()} Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.send({
            to: email,
            subject: '✅ Pagamento aprovado - Finalize seu cadastro no MecPro',
            html,
        });
    }
    async sendWelcomeEmail(email, name) {
        const appUrl = process.env.APP_URL || 'https://mecpro.tec.br';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bem-vindo ao MecPro</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #00e5ff, #0077ff); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; }
          .content { padding: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #00e5ff, #0077ff); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MecPro</h1>
          </div>
          <div class="content">
            <h2>Bem-vindo, ${name}! 🚀</h2>
            <p>Seu cadastro foi concluído com sucesso.</p>
            <p>Agora você já pode acessar o sistema e começar a gerenciar sua oficina.</p>
            <div style="text-align: center;">
              <a href="${appUrl}/login" class="button">Acessar o Sistema</a>
            </div>
          </div>
          <div class="footer">
            <p>MecPro - Sistema para Oficinas Mecânicas</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.send({
            to: email,
            subject: '🎉 Bem-vindo ao MecPro - Cadastro concluído',
            html,
        });
    }
    async sendSubscriptionCanceledEmail(email, name) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Assinatura Cancelada</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ff4444, #cc0000); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; }
          .content { padding: 30px; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MecPro</h1>
          </div>
          <div class="content">
            <h2>Assinatura Cancelada</h2>
            <p>Olá, ${name}</p>
            <p>Sua assinatura foi cancelada. Seu acesso à plataforma foi revogado.</p>
            <p>Para reativar seu acesso, entre em contato com o suporte ou realize um novo pagamento.</p>
            <hr>
            <p style="color: #666; font-size: 14px;">Caso não tenha solicitado o cancelamento, entre em contato imediatamente.</p>
          </div>
          <div class="footer">
            <p>MecPro - Sistema para Oficinas Mecânicas</p>
          </div>
        </div>
      </body>
      </html>
    `;
        await this.send({
            to: email,
            subject: '❌ Assinatura cancelada - MecPro',
            html,
        });
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map