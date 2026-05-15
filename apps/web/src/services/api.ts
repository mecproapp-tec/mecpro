// apps/web/src/services/api.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = response.data;
          localStorage.setItem("token", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  if (response.data.accessToken) {
    localStorage.setItem("token", response.data.accessToken);
    if (response.data.refreshToken) localStorage.setItem("refreshToken", response.data.refreshToken);
    if (response.data.user) {
      localStorage.setItem("userName", response.data.user.name);
      localStorage.setItem("userRole", response.data.user.role);
      localStorage.setItem("tenantId", response.data.user.tenantId);
    }
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("tenantId");
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data.user;
};

export const registerTenant = async (data: any) => {
  const response = await api.post("/auth/register-tenant", data);
  return response.data;
};

// ========== WhatsApp ==========
export const sendWhatsApp = async (
  tipo: "invoice" | "estimate",
  id: number,
  phoneNumber?: string
) => {
  const response = await api.post(`/${tipo}s/${id}/send-whatsapp`, { phoneNumber });
  return response.data;
};

export const sendInvoiceWhatsApp = async (invoiceId: number, phoneNumber?: string) => {
  return sendWhatsApp("invoice", invoiceId, phoneNumber);
};

export const sendEstimateWhatsApp = async (estimateId: number, phoneNumber?: string) => {
  return sendWhatsApp("estimate", estimateId, phoneNumber);
};

export default api;