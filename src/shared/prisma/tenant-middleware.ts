import { Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Armazena o tenantId atual por requisição
export const tenantStorage = new AsyncLocalStorage<{ tenantId: string | null }>();

/**
 * Middleware Prisma que injeta tenantId automaticamente em todas as queries
 */
export function tenantMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const store = tenantStorage.getStore();
    const tenantId = store?.tenantId;

    // Se não tem tenant no contexto, ou é super-admin, apenas executa
    if (!tenantId) {
      return next(params);
    }

    // 🔥 CORREÇÃO: Model 'Tenant' NÃO possui campo tenantId, então removemos da lista
    const modelsWithTenant = [
      // 'Tenant',  // ← REMOVIDO - causa erro P2022
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

    if (!modelsWithTenant.includes(params.model as string)) {
      return next(params);
    }

    // Ações que suportam where
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
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};

      // Não sobrescreve se já existe tenantId (ex: super-admin forçando)
      if (params.args.where.tenantId === undefined) {
        params.args.where.tenantId = tenantId;
      }
    }

    // Para create/createMany, insere tenantId automaticamente
    if (params.action === 'create') {
      if (!params.args.data) params.args.data = {};
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
      } else if (params.args.data) {
        params.args.data.tenantId = params.args.data.tenantId ?? tenantId;
      }
    }

    return next(params);
  };
}