import { Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
export declare const tenantStorage: AsyncLocalStorage<{
    tenantId: string | null;
}>;
export declare function tenantMiddleware(): Prisma.Middleware;
