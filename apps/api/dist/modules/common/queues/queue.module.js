"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const pdf_processor_1 = require("./pdf.processor");
const prisma_module_1 = require("../../../shared/prisma/prisma.module");
const storage_module_1 = require("../../storage/storage.module");
const invoices_module_1 = require("../../invoices/invoices.module");
const estimates_module_1 = require("../../estimates/estimates.module");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRoot({ connection: { url: process.env.REDIS_URL } }),
            bullmq_1.BullModule.registerQueue({ name: 'pdf' }),
            prisma_module_1.PrismaModule,
            storage_module_1.StorageModule,
            invoices_module_1.InvoicesModule,
            estimates_module_1.EstimatesModule,
        ],
        providers: [pdf_processor_1.PdfProcessor],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map