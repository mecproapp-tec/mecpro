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
var PdfProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const invoices_pdf_service_1 = require("../../invoices/invoices-pdf.service");
const estimates_pdf_service_1 = require("../../estimates/estimates-pdf.service");
const storage_service_1 = require("../../storage/storage.service");
const prisma_service_1 = require("../../../shared/prisma/prisma.service");
let PdfProcessor = PdfProcessor_1 = class PdfProcessor extends bullmq_1.WorkerHost {
    constructor(invoicesPdf, estimatesPdf, storage, prisma) {
        super();
        this.invoicesPdf = invoicesPdf;
        this.estimatesPdf = estimatesPdf;
        this.storage = storage;
        this.prisma = prisma;
        this.logger = new common_1.Logger(PdfProcessor_1.name);
    }
    async process(job) {
        const { type, id, tenantId } = job.data;
        this.logger.log(`Processando PDF ${type} ${id}`);
        if (type === 'invoice') {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id },
                include: { client: true, tenant: true, items: true },
            });
            const pdfBuffer = await this.invoicesPdf.generateInvoicePdf(invoice);
            const key = `${tenantId}/invoices/${id}-${Date.now()}.pdf`;
            const url = await this.storage.uploadPdf(pdfBuffer, key);
            await this.prisma.invoice.update({
                where: { id },
                data: {
                    pdfUrl: url,
                    pdfKey: key,
                    pdfStatus: 'generated',
                    pdfGeneratedAt: new Date()
                },
            });
        }
        else {
            const estimate = await this.prisma.estimate.findUnique({
                where: { id },
                include: { client: true, tenant: true, items: true },
            });
            const pdfBuffer = await this.estimatesPdf.generateEstimatePdf(estimate);
            const key = `${tenantId}/estimates/${id}-${Date.now()}.pdf`;
            const url = await this.storage.uploadPdf(pdfBuffer, key);
            await this.prisma.estimate.update({
                where: { id },
                data: {
                    pdfUrl: url,
                    pdfKey: key,
                    pdfStatus: 'generated',
                    pdfGeneratedAt: new Date()
                },
            });
        }
        return { success: true };
    }
};
exports.PdfProcessor = PdfProcessor;
exports.PdfProcessor = PdfProcessor = PdfProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('pdf'),
    __metadata("design:paramtypes", [invoices_pdf_service_1.InvoicesPdfService,
        estimates_pdf_service_1.EstimatesPdfService,
        storage_service_1.StorageService,
        prisma_service_1.PrismaService])
], PdfProcessor);
//# sourceMappingURL=pdf.processor.js.map