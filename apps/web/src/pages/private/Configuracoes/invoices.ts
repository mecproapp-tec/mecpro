import api from "../../../services/api";

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total?: number;
}

export interface Invoice {
  id: number;
  clientId: number;
  clientName?: string;
  estimateId?: number;
  number: string;
  total: number;
  status: "pending" | "paid" | "canceled";
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  clientId: number;
  estimateId?: number;
  number: string;
  items: Omit<InvoiceItem, "total">[];
}

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get("/invoices");
  return response.data;
};

export const getInvoiceById = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  const response = await api.post("/invoices", data);
  return response.data;
};

export const updateInvoice = async (id: number, data: CreateInvoiceData): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id: number): Promise<void> => {
  await api.delete(`/invoices/${id}`);
};

export function calculateInvoiceTotal(items: InvoiceItem[]): number {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}