import axios from "axios";

// ==========================
// 🌍 URL BASE DA API
// ==========================
// Em desenvolvimento, use .env.development com VITE_API_URL=http://mecpro.tec.br:3000/api
// Em produção, use .env.production com VITE_API_URL=https://mecpro.tec.br/api
const API_URL = import.meta.env.VITE_API_URL || "http://mecpro.tec.br:3000/api";
console.log("🔧 API_URL:", API_URL); // Útil para debug

// ==========================
// 🚀 INSTÂNCIA AXIOS
// ==========================
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true, // Permite envio de cookies (se necessário)
});

// ==========================
// 🔐 REQUEST INTERCEPTOR (TOKEN)
// ==========================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================
// ❌ RESPONSE INTERCEPTOR (ERROS)
// ==========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Caso o backend retorne HTML (ex: página de erro do servidor)
    if (
      error.response &&
      typeof error.response.data === "string" &&
      error.response.data.includes("<!doctype")
    ) {
      console.error("🚨 Backend retornou HTML (rota errada ou server offline)");
    }

    // Token expirado ou não autorizado
    if (error.response?.status === 401) {
      console.warn("🔐 Token expirado. Fazendo logout...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("oficina");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ==========================
// 🔐 AUTH
// ==========================
export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("oficina");
  window.location.href = "/login";
};

export const registerTenant = async (data: {
  officeName: string;
  documentType: string;
  documentNumber: string;
  cep: string;
  address: string;
  email: string;
  phone: string;
  ownerName: string;
  password: string;
  paymentCompleted: boolean;
  preapprovalId?: string;
}) => {
  const response = await api.post("/auth/register-tenant", data);
  return response.data;
};

// ==========================
// 💬 WHATSAPP
// ==========================
export const sendWhatsApp = async (tipo: "invoice" | "estimate", id: number) => {
  const response = await api.post(`/${tipo}s/${id}/send-whatsapp`);
  return response.data;
};

// ==========================
// 📦 EXPORT
// ==========================
export { api };
export default api;