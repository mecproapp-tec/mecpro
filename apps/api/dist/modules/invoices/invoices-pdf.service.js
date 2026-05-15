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
var InvoicesPdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesPdfService = void 0;
const common_1 = require("@nestjs/common");
const Handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer = __importStar(require("puppeteer"));
let InvoicesPdfService = InvoicesPdfService_1 = class InvoicesPdfService {
    constructor() {
        this.logger = new common_1.Logger(InvoicesPdfService_1.name);
        this.templateCache = null;
    }
    async getBrowser() {
        const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        if (fs.existsSync(chromePath)) {
            this.logger.log(`✅ Usando Chrome: ${chromePath}`);
            return puppeteer.launch({
                executablePath: chromePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                headless: true,
            });
        }
        const altPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
        if (fs.existsSync(altPath)) {
            this.logger.log(`✅ Usando Chrome alternativo: ${altPath}`);
            return puppeteer.launch({
                executablePath: altPath,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                headless: true,
            });
        }
        this.logger.warn('Chrome não encontrado, tentando Chromium padrão...');
        return puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
    }
    loadTemplate() {
        if (this.templateCache)
            return this.templateCache;
        let templatePath = null;
        const possiblePaths = [
            path.join(__dirname, 'templates', 'invoice-pdf.hbs'),
            path.join(__dirname, 'invoice-pdf.hbs'),
            path.join(process.cwd(), 'dist', 'modules', 'invoices', 'templates', 'invoice-pdf.hbs'),
            path.join(process.cwd(), 'src', 'modules', 'invoices', 'templates', 'invoice-pdf.hbs'),
        ];
        for (const tryPath of possiblePaths) {
            if (fs.existsSync(tryPath)) {
                templatePath = tryPath;
                this.logger.log(`Template encontrado em: ${tryPath}`);
                break;
            }
        }
        if (!templatePath) {
            throw new Error(`Template não encontrado`);
        }
        const templateHtml = fs.readFileSync(templatePath, 'utf-8');
        this.templateCache = Handlebars.compile(templateHtml);
        return this.templateCache;
    }
    async generateInvoicePdf(invoice) {
        if (!invoice) {
            throw new common_1.InternalServerErrorException('Dados inválidos para gerar PDF');
        }
        let browser = null;
        try {
            const compiledTemplate = this.loadTemplate();
            const client = invoice.client || {};
            const tenant = invoice.tenant || {};
            let subtotal = 0;
            let totalIss = 0;
            const items = (invoice.items || []).map((item) => {
                const quantity = Number(item.quantity) || 1;
                const price = Number(item.price) || 0;
                const issPercent = Number(item.issPercent) || 0;
                const subtotalItem = quantity * price;
                const issValue = subtotalItem * (issPercent / 100);
                const totalWithIss = subtotalItem + issValue;
                subtotal += subtotalItem;
                totalIss += issValue;
                return {
                    description: item.description || '-',
                    quantity,
                    unitPrice: price.toFixed(2),
                    issPercent: issPercent.toFixed(1),
                    issValue: issValue.toFixed(2),
                    totalWithIss: totalWithIss.toFixed(2),
                };
            });
            const total = subtotal + totalIss;
            const issueDateObj = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
            const html = compiledTemplate({
                invoiceNumber: invoice.number || invoice.id,
                client: {
                    name: client.name || 'Cliente não informado',
                    phone: client.phone || '-',
                    vehicle: client.vehicle || '-',
                    plate: client.plate || '-',
                    document: client.document || '-',
                    address: client.address || '-',
                },
                items,
                subtotal: subtotal.toFixed(2),
                totalIss: totalIss.toFixed(2),
                total: total.toFixed(2),
                companyName: tenant.name || 'MecPro',
                companyDocument: tenant.documentNumber || 'CNPJ: --',
                companyPhone: tenant.phone || '(11) 99999-9999',
                companyEmail: tenant.email || 'contato@mecpro.com.br',
                companyAddress: tenant.address || '',
                companyLogo: tenant.logoUrl || '',
                issueDate: issueDateObj.toLocaleDateString('pt-BR'),
                dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR'),
            });
            this.logger.log(`Gerando PDF para fatura ${invoice.id} (${items.length} itens)`);
            browser = await this.getBrowser();
            const page = await browser.newPage();
            await page.setContent(html, {
                waitUntil: 'networkidle0',
                timeout: 30000,
            });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                },
            });
            this.logger.log(`PDF gerado com sucesso: ${pdf.length} bytes`);
            return Buffer.from(pdf);
        }
        catch (error) {
            this.logger.error(`Erro ao gerar PDF para fatura ${invoice.id}`, error);
            throw new common_1.InternalServerErrorException(`Erro ao gerar PDF: ${error.message}`);
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
};
exports.InvoicesPdfService = InvoicesPdfService;
exports.InvoicesPdfService = InvoicesPdfService = InvoicesPdfService_1 = __decorate([
    (0, common_1.Injectable)()
], InvoicesPdfService);
//# sourceMappingURL=invoices-pdf.service.js.map