"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantStorage = void 0;
exports.tenantMiddleware = tenantMiddleware;
const async_hooks_1 = require("async_hooks");
exports.tenantStorage = new async_hooks_1.AsyncLocalStorage();
function tenantMiddleware() {
    return async (params, next) => {
        const store = exports.tenantStorage.getStore();
        const tenantId = store?.tenantId;
        if (!tenantId) {
            return next(params);
        }
        const modelsWithTenant = [
            'User',
            'Client',
            'Appointment',
            'Estimate',
            'EstimateItem',
            'Invoice',
            'InvoiceItem',
            'Subscription',
            'Payment',
            'PendingSubscription',
            'PublicShare',
            'Notification',
            'ScheduledNotification',
            'ContactMessage',
        ];
        if (!modelsWithTenant.includes(params.model)) {
            return next(params);
        }
        const actionsWithWhere = [
            'findUnique',
            'findFirst',
            'findMany',
            'update',
            'updateMany',
            'delete',
            'deleteMany',
            'count',
            'aggregate',
        ];
        if (actionsWithWhere.includes(params.action)) {
            if (!params.args)
                params.args = {};
            if (!params.args.where)
                params.args.where = {};
            if (params.args.where.tenantId === undefined) {
                params.args.where.tenantId = tenantId;
            }
        }
        if (params.action === 'create') {
            if (!params.args.data)
                params.args.data = {};
            if (params.args.data.tenantId === undefined) {
                params.args.data.tenantId = tenantId;
            }
        }
        if (params.action === 'createMany') {
            if (Array.isArray(params.args.data)) {
                params.args.data = params.args.data.map((item) => ({
                    ...item,
                    tenantId: item.tenantId ?? tenantId,
                }));
            }
            else if (params.args.data) {
                params.args.data.tenantId = params.args.data.tenantId ?? tenantId;
            }
        }
        return next(params);
    };
}
//# sourceMappingURL=tenant-middleware.js.map