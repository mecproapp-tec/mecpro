"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const clients_module_1 = require("./modules/clients/clients.module");
const estimates_module_1 = require("./modules/estimates/estimates.module");
const invoices_module_1 = require("./modules/invoices/invoices.module");
const storage_module_1 = require("./modules/storage/storage.module");
const pdf_module_1 = require("./modules/pdf/pdf.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const appointments_module_1 = require("./modules/appointments/appointments.module");
const public_share_module_1 = require("./modules/public-share/public-share.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const users_module_1 = require("./modules/users/users.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const admin_module_1 = require("./modules/admin/admin.module");
const contact_module_1 = require("./modules/contact/contact.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const payments_module_1 = require("./payments/payments.module");
const webhook_module_1 = require("./webhook/webhook.module");
const worker_module_1 = require("./work/worker.module");
const prisma_module_1 = require("./shared/prisma/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            clients_module_1.ClientsModule,
            estimates_module_1.EstimatesModule,
            invoices_module_1.InvoicesModule,
            storage_module_1.StorageModule,
            pdf_module_1.PdfModule,
            notifications_module_1.NotificationsModule,
            appointments_module_1.AppointmentsModule,
            public_share_module_1.PublicShareModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            subscriptions_module_1.SubscriptionsModule,
            admin_module_1.AdminModule,
            contact_module_1.ContactModule,
            dashboard_module_1.DashboardModule,
            whatsapp_module_1.WhatsappModule,
            payments_module_1.PaymentsModule,
            webhook_module_1.WebhookModule,
            worker_module_1.WorkerModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map