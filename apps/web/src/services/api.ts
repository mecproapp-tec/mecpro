import axios from "axios";

const baseUrl =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? "https://api.mecpro.tec.br/api"
    : "http://localhost:3000/api");
const API_URL = baseUrl.replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta: NÃO remove token NÃO redireciona
// Apenas loga e rejeita a promise
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`❌ Erro ${error.response.status} em ${error.config?.url}:`, error.response.data);
    } else {
      console.error("❌ Erro de rede:", error.message);
    }
    // Não remove token nem redireciona. Deixe o componente decidir.
    return Promise.reject(error);
  }
);

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (e) {}
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const registerTenant = async (data: any) => {
  const response = await api.post("/auth/register-tenant", data);
  return response.data;
};

export const sendWhatsApp = async (tipo: "invoice" | "estimate", id: number) => {
  const response = await api.post(`/${tipo}s/${id}/send-whatsapp`);
  return response.data;
};

export { api };
export default api;