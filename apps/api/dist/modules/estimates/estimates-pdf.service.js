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
var EstimatesPdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimatesPdfService = void 0;
const common_1 = require("@nestjs/common");
const Handlebars = __importStar(require("handlebars"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer = __importStar(require("puppeteer"));
const storage_service_1 = require("../storage/storage.service");
let EstimatesPdfService = EstimatesPdfService_1 = class EstimatesPdfService {
    constructor(storageService) {
        this.storageService = storageService;
        this.logger = new common_1.Logger(EstimatesPdfService_1.name);
        this.templateCache = null;
    }
    async getBrowser() {
        const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        try {
            if (fs.existsSync(chromePath)) {
                this.logger.log(`Usando Chrome: ${chromePath}`);
                return await puppeteer.launch({
                    executablePath: chromePath,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                    headless: true,
                });
            }
            const altPath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
            if (fs.existsSync(altPath)) {
                this.logger.log(`Usando Chrome alternativo`);
                return await puppeteer.launch({
                    executablePath: altPath,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                    headless: true,
                });
            }
            this.logger.warn('Chrome não encontrado, usando Chromium padrão');
            return await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            });
        }
        catch (error) {
            this.logger.error('Erro ao iniciar browser', error);
            throw new common_1.InternalServerErrorException('Erro ao iniciar navegador PDF');
        }
    }
    loadTemplate() {
        if (this.templateCache)
            return this.templateCache;
        const possiblePaths = [
            path.join(process.cwd(), 'dist', 'modules', 'estimates', 'estimates-pdf.hbs'),
            path.join(process.cwd(), 'src', 'modules', 'estimates', 'estimates-pdf.hbs'),
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                this.logger.log(`Template encontrado em: ${p}`);
                const html = fs.readFileSync(p, 'utf-8');
                this.templateCache = Handlebars.compile(html);
                return this.templateCache;
            }
        }
        this.logger.error('Template não encontrado');
        throw new common_1.InternalServerErrorException('Template de orçamento não encontrado');
    }
    async generateEstimatePdf(estimate) {
        let browser = null;
        try {
            if (!estimate)
                throw new common_1.InternalServerErrorException('Dados inválidos para PDF');
            const template = this.loadTemplate();
            let subtotal = 0, totalIss = 0;
            const items = (estimate.items || []).map((item) => {
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
            const html = template({
                estimateNumber: estimate.id,
                client: {
                    name: estimate.client?.name || 'Cliente não informado',
                    phone: estimate.client?.phone || '-',
                    vehicle: estimate.client?.vehicle || '-',
                    plate: estimate.client?.plate || '-',
                    document: estimate.client?.document || '-',
                    address: estimate.client?.address || '-',
                },
                items,
                subtotal: subtotal.toFixed(2),
                totalIss: totalIss.toFixed(2),
                total: total.toFixed(2),
                companyName: estimate.tenant?.name || 'MecPro',
                companyDocument: estimate.tenant?.documentNumber || 'CNPJ: --',
                companyPhone: estimate.tenant?.phone || '(11) 99999-9999',
                companyEmail: estimate.tenant?.email || 'contato@mecpro.com.br',
                companyAddress: estimate.tenant?.address || '',
                companyLogo: estimate.tenant?.logoUrl || '',
                issueDate: new Date().toLocaleDateString('pt-BR'),
                validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('pt-BR'),
            });
            this.logger.log(`Gerando PDF orçamento ${estimate.id}`);
            browser = await this.getBrowser();
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
            });
            const pdfBuffer = Buffer.from(pdf);
            const tenantId = estimate.tenant?.id || estimate.tenantId || 'unknown';
            const key = `tenants/${tenantId}/estimates/estimate_${estimate.id}.pdf`;
            await this.storageService.uploadPdf(pdfBuffer, key, tenantId);
            this.logger.log(`PDF salvo no R2: ${key}`);
            return pdfBuffer;
        }
        catch (error) {
            this.logger.error(`Erro ao gerar PDF orçamento ${estimate?.id}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException(`Erro ao gerar PDF: ${error.message}`);
        }
        finally {
            if (browser)
                await browser.close();
        }
    }
};
exports.EstimatesPdfService = EstimatesPdfService;
exports.EstimatesPdfService = EstimatesPdfService = EstimatesPdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], EstimatesPdfService);
//# sourceMappingURL=estimates-pdf.service.js.map