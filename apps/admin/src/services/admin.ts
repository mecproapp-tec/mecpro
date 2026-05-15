// apps/admin/src/services/admin.ts
import api from './api';

export interface DashboardData {
  totalTenants: number;
  activeTenants: number;
  blockedTenants: number;
  totalClients: number;
  totalEstimates: number;
  totalInvoices: number;
  recentTenants: Array<{ id: string; name: string; email: string; createdAt: string; status: string }>;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  documentNumber: string;
  phone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  users: any[];
  clients?: any[];
  estimates?: any[];
  invoices?: any[];
  _count?: { clients: number; estimates: number; invoices: number };
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  status: string;
  tenantId: string;
  tenantName?: string;
}

export interface Estimate {
  id: string;
  clientId: string;
  clientName?: string;
  date: string;
  total: number;
  status: string;
  tenantId: string;
  tenantName?: string;
}

export interface Invoice {
  id: string;
  number: string;
  total: number;
  status: string;
  createdAt: string;
  clientId: number;
  clientName?: string;
  tenantId: string;
  tenantName?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  target: string;
  tenantIds?: string[];
  sentAt: string;
  read: boolean;
}

interface CacheEntry {
  data: Tenant[];
  promise: Promise<Tenant[]> | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(params?: { status?: string; search?: string }): string {
  if (!params) return 'default';
  return `${params.status || ''}|${params.search || ''}`;
}

export const getTenants = async (params?: { status?: string; search?: string }, options?: { signal?: AbortSignal }): Promise<Tenant[]> => {
  const key = getCacheKey(params);
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = api.get('/admin/tenants', { params, signal: options?.signal })
    .then(response => {
      const data = response.data;
      cache.set(key, {
        data,
        promise: null,
        timestamp: Date.now(),
      });
      return data;
    })
    .catch(error => {
      const entry = cache.get(key);
      if (entry) entry.promise = null;
      throw error;
    });

  cache.set(key, { data: [] as Tenant[], promise, timestamp: now });
  return promise;
};

export const invalidateTenantsCache = (params?: { status?: string; search?: string }) => {
  const key = getCacheKey(params);
  cache.delete(key);
};

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getTenant = async (id: string): Promise<Tenant> => {
  const response = await api.get(`/admin/tenants/${id}`);
  return response.data;
};

export const getTenantClients = async (tenantId: string) => {
  const response = await api.get(`/admin/tenants/${tenantId}/clients`);
  return response.data;
};

export const getTenantEstimates = async (tenantId: string) => {
  const response = await api.get(`/admin/tenants/${tenantId}/estimates`);
  return response.data;
};

export const getTenantInvoices = async (tenantId: string) => {
  const response = await api.get(`/admin/tenants/${tenantId}/invoices`);
  return response.data;
};

export const updateTenantStatus = async (id: string, status: string) => {
  const response = await api.put(`/admin/tenants/${id}/status`, { status });
  return response.data;
};

export const deleteTenant = async (id: string) => {
  await api.delete(`/admin/tenants/${id}`);
};

export const getFinancialSummary = async (month?: number, year?: number) => {
  const params = new URLSearchParams();
  if (month !== undefined) params.append('month', month.toString());
  if (year !== undefined) params.append('year', year.toString());
  const response = await api.get('/admin/financial/summary', { params });
  return response.data;
};

export const sendNotification = async (data: { message: string; title: string; target: 'all' | 'specific'; tenantIds?: string[] }) => {
  const response = await api.post('/admin/notifications/send', data);
  return response.data;
};

export const scheduleNotification = async (data: { message: string; title: string; schedule: Date; target: 'all' | 'specific'; tenantIds?: string[] }) => {
  const response = await api.post('/admin/notifications/schedule', data);
  return response.data;
};

export const getNotifications = async (): Promise<AdminNotification[]> => {
  const response = await api.get('/admin/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.put(`/admin/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put('/admin/notifications/read-all');
};

export const getAllClients = async (params?: { search?: string; tenantId?: string }): Promise<Client[]> => {
  const response = await api.get('/admin/clients', { params });
  return response.data;
};

export const getAllEstimates = async (params?: { status?: string; tenantId?: string }): Promise<Estimate[]> => {
  const response = await api.get('/admin/estimates', { params });
  return response.data;
};

export const getAllInvoices = async (params?: { status?: string; tenantId?: string; startDate?: string; endDate?: string }): Promise<Invoice[]> => {
  const response = await api.get('/admin/invoices', { params });
  return response.data;
};

export const getClientById = async (id: number | string) => {
  const response = await api.get(`/admin/clients/${id}`);
  return response.data;
};

export const getEstimateById = async (id: number | string) => {
  const response = await api.get(`/admin/estimates/${id}`);
  return response.data;
};

export const getInvoiceById = async (id: number | string) => {
  const response = await api.get(`/admin/invoices/${id}`);
  return response.data;
};

export const blockClient = async (id: number | string) => {
  const response = await api.put(`/admin/clients/${id}/block`);
  return response.data;
};

export const activateClient = async (id: number | string) => {
  const response = await api.put(`/admin/clients/${id}/activate`);
  return response.data;
};

export const sendMessageToClient = async (clientId: string | number, data: { subject: string; message: string }) => {
  const response = await api.post(`/admin/clients/${clientId}/send-message`, data);
  return response.data;
};

export const getAllUsers = async (params?: { search?: string; role?: string }) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const blockUser = async (id: number | string) => {
  const response = await api.put(`/admin/users/${id}/block`);
  return response.data;
};

export const activateUser = async (id: number | string) => {
  const response = await api.put(`/admin/users/${id}/activate`);
  return response.data;
};