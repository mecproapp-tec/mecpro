"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
let PdfService = PdfService_1 = class PdfService {
    constructor() {
        this.logger = new common_1.Logger(PdfService_1.name);
    }
    async generateInvoicePdf(invoice) {
        return this.generateDocument({
            title: 'Fatura',
            number: invoice.number,
            date: invoice.createdAt,
            client: invoice.client,
            items: invoice.items,
            total: invoice.total,
            tenant: invoice.tenant,
        });
    }
    async generateEstimatePdf(estimate) {
        return this.generateDocument({
            title: 'Orçamento',
            number: estimate.id.toString(),
            date: estimate.date,
            client: estimate.client,
            items: estimate.items,
            total: estimate.total,
            tenant: estimate.tenant,
        });
    }
    generateDocument(data) {
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.fontSize(20).text(data.title, { align: 'center' });
            doc.moveDown();
            if (data.tenant) {
                doc.fontSize(12).text(data.tenant.name || 'Oficina');
                doc.text(`CNPJ/CPF: ${data.tenant.documentNumber || '—'}`);
                doc.text(`Endereço: ${data.tenant.address || '—'}`);
                doc.text(`Telefone: ${data.tenant.phone || '—'}`);
                doc.text(`E-mail: ${data.tenant.email || '—'}`);
                doc.moveDown();
            }
            doc.fontSize(12);
            doc.text(`Número: ${data.number}`);
            doc.text(`Data: ${new Date(data.date).toLocaleDateString()}`);
            doc.moveDown();
            if (data.client) {
                doc.text(`Cliente: ${data.client.name}`);
                doc.text(`Telefone: ${data.client.phone || '—'}`);
                doc.text(`Veículo: ${data.client.vehicle || '—'} - Placa: ${data.client.plate || '—'}`);
                doc.moveDown();
            }
            if (data.items && data.items.length) {
                doc.text('Itens:');
                doc.moveDown(0.5);
                const startX = doc.x;
                const startY = doc.y;
                doc.fontSize(10);
                doc.text('Descrição', startX, startY);
                doc.text('Qtd', startX + 250, startY);
                doc.text('Preço', startX + 320, startY);
                doc.text('Total', startX + 400, startY);
                doc.moveDown();
                let y = doc.y;
                for (const item of data.items) {
                    const description = item.description || '—';
                    const quantity = item.quantity || 1;
                    const price = Number(item.price) || 0;
                    const subtotal = price * quantity;
                    doc.text(description.substring(0, 40), startX, y);
                    doc.text(quantity.toString(), startX + 250, y);
                    doc.text(`R$ ${price.toFixed(2)}`, startX + 320, y);
                    doc.text(`R$ ${subtotal.toFixed(2)}`, startX + 400, y);
                    doc.moveDown();
                    y = doc.y;
                }
                doc.moveDown();
                doc.fontSize(12);
                doc.text(`Total Geral: R$ ${Number(data.total).toFixed(2)}`, { align: 'right' });
            }
            else {
                doc.text('Nenhum item encontrado.');
            }
            doc.end();
        });
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map