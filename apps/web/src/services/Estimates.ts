import api from "./api";
import { normalizeArray } from "../utils/normalizeArray";

export interface EstimateItem {
  id?: number;
  description: string;
  quantity: number;
  price: number;
  total?: number;
  issPercent?: number;
}

export interface Estimate {
  id: number;
  clientId: number;
  total: number;
  status: "DRAFT" | "SENT" | "APPROVED" | "CONVERTED";
  date: string;
  createdAt: string;
  updatedAt?: string;
  pdfUrl?: string;
  pdfStatus?: string;
  pdfGeneratedAt?: string;
  shareToken?: string;
  shareTokenExpires?: string;
  items: EstimateItem[];
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

export interface CreateEstimateData {
  clientId: number;
  date: string;
  items: Omit<EstimateItem, "id" | "total">[];
  status?: "DRAFT" | "SENT" | "APPROVED" | "CONVERTED";
}

function extractObject(data: any) {
  return data?.data || data;
}

export const getEstimates = async (page = 1, limit = 50) => {
  const response = await api.get(`/estimates?page=${page}&limit=${limit}`);
  const dataArray = normalizeArray<Estimate>(response.data);
  return {
    data: dataArray,
    total: response.data?.total ?? dataArray.length,
    page,
    limit,
    totalPages: Math.ceil((response.data?.total ?? dataArray.length) / limit),
  };
};

export const getEstimateById = async (id: number): Promise<Estimate> => {
  const response = await api.get(`/estimates/${id}`);
  return extractObject(response.data);
};

export const createEstimate = async (data: CreateEstimateData): Promise<Estimate> => {
  const response = await api.post("/estimates", data);
  return extractObject(response.data);
};

export const updateEstimate = async (id: number, data: CreateEstimateData): Promise<Estimate> => {
  const response = await api.patch(`/estimates/${id}`, data);
  return extractObject(response.data);
};

export const deleteEstimate = async (id: number): Promise<void> => {
  await api.delete(`/estimates/${id}`);
};

export const convertEstimate = async (id: number): Promise<{ invoiceId: number; invoiceNumber: string; message: string }> => {
  const response = await api.post(`/estimates/${id}/convert`);
  const data = response.data?.data || response.data;
  return {
    invoiceId: data?.invoiceId || data?.invoice?.id || 0,
    invoiceNumber: data?.invoiceNumber || data?.invoice?.number || "",
    message: data?.message || "Convertido com sucesso",
  };
};

export function calculateTotalWithIss(items: EstimateItem[]): number {
  return items.reduce((acc, item) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    const iss = item.issPercent ? itemTotal * (item.issPercent / 100) : 0;
    return acc + itemTotal + iss;
  }, 0);
}

export const sendEstimateWhatsApp = async (id: number, phoneNumber?: string) => {
  const response = await api.post(`/estimates/${id}/send-whatsapp`, { phoneNumber });
  return extractObject(response.data);
};

export const generateEstimateShareToken = async (id: number): Promise<{ token: string }> => {
  const response = await api.post(`/estimates/${id}/share`);
  return extractObject(response.data);
};

export const getEstimateByToken = async (token: string): Promise<Estimate> => {
  const response = await api.get(`/estimates/share/${token}`);
  return extractObject(response.data);
};