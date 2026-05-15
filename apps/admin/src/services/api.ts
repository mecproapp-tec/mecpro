import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

console.log("🔧 ADMIN API_URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      typeof error.response.data === "string" &&
      error.response.data.includes("<!doctype")
    ) {
      console.error("🚨 API retornou HTML (rota errada ou API offline)");
    }

    if (error.response?.status === 401) {
      console.warn("🔐 Token expirado. Fazendo logout...");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;