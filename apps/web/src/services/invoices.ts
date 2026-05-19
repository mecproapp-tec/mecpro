import api from "./api";
import { normalizeArray } from "../utils/normalizeArray";

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  price: number;
  total?: number;
  issPercent?: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  number: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
  updatedAt?: string;
  pdfUrl?: string;
  pdfStatus?: string;
  pdfGeneratedAt?: string;
  shareToken?: string;
  shareTokenExpires?: string;
  items: InvoiceItem[];
  paymentMethod?: string;
  client?: {
    id: number;
    name: string;
    phone?: string;
    vehicle?: string;
    plate?: string;
    address?: string;
    document?: string;
  };
}

export interface CreateInvoiceData {
  clientId: number;
  items: Omit<InvoiceItem, "id" | "total">[];
  status?: "PENDING" | "PAID" | "CANCELED";
  paymentMethod?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function extractObject(data: any): any {
  return data?.data || data;
}

export const getInvoices = async (page: number = 1, limit: number = 50): Promise<PaginatedResponse<Invoice>> => {
  const response = await api.get(`/invoices?page=${page}&limit=${limit}`);
  
  if (response.data?.data && Array.isArray(response.data.data)) {
    return {
      data: normalizeArray<Invoice>(response.data.data),
      total: response.data.total || response.data.data.length,
      page: response.data.page || page,
      limit: response.data.limit || limit,
      totalPages: response.data.totalPages || Math.ceil((response.data.total || response.data.data.length) / limit),
    };
  }
  
  const dataArray = normalizeArray<Invoice>(response.data);
  return {
    data: dataArray,
    total: dataArray.length,
    page,
    limit,
    totalPages: Math.ceil(dataArray.length / limit),
  };
};

export const getAllInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get("/invoices?limit=10000");
  return normalizeArray<Invoice>(response.data);
};

export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return extractObject(response.data);
};

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  const response = await api.post("/invoices", data);
  return extractObject(response.data);
};

export const updateInvoice = async (id: number, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}`, data);
  return extractObject(response.data);
};

export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export function calculateTotalWithIss(items: InvoiceItem[]): number {
  return items.reduce((acc, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
    return acc + itemTotal + iss;
  }, 0);
}

export const shareInvoice = async (id: number): Promise<{ shareUrl: string }> => {
  try {
    const response = await api.post(`/invoices/${id}/share`);
    return extractObject(response.data);
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 405) {
      console.warn(`POST /invoices/${id}/share não disponível, tentando GET...`);
      const response = await api.get(`/invoices/${id}/share`);
      return extractObject(response.data);
    }
    throw error;
  }
};

export const sendInvoiceWhatsApp = async (id: number, phoneNumber?: string) => {
  const response = await api.post(`/invoices/${id}/send-whatsapp`, { phoneNumber });
  return extractObject(response.data);
};

export const resendInvoicePdf = async (id: number): Promise<{ pdfUrl: string }> => {
  const response = await api.post(`/invoices/${id}/resend-pdf`);
  return extractObject(response.data);
};