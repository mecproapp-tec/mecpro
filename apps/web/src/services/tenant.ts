// apps/web/src/services/tenant.ts
import api from "./api";

export interface UpdateTenantData {
  nome: string;
  tipoDocumento: string;
  documento: string;
  numero: string;
  complemento: string;
  endereco: string;
  telefone: string;
  email: string;
  logo?: string;
}

export interface TenantData {
  id?: string;
  nome: string;
  tipoDocumento: string;
  documento: string;
  numero: string;
  complemento: string;
  endereco: string;
  telefone: string;
  email: string;
  logo?: string;
}

export async function getTenant(): Promise<TenantData> {
  // Força o navegador a não usar cache
  const response = await api.get("/tenants/me", {
    params: { _t: Date.now() } // ← quebra cache
  });
  const data = response.data?.data || response.data;
  console.log("[getTenant] Dados crus da API:", data);
  return {
    nome: data.nome || "",
    tipoDocumento: data.tipoDocumento || "CPF",
    documento: data.documento || "",
    numero: data.numero || "",
    complemento: data.complemento || "",
    endereco: data.endereco || "",
    telefone: data.telefone || "",
    email: data.email || "",
    logo: data.logo || "",
  };
}

export async function updateTenant(data: UpdateTenantData): Promise<TenantData> {
  const response = await api.put("/tenants/me", {
    nome: data.nome,
    tipoDocumento: data.tipoDocumento,
    documento: data.documento,
    endereco: data.endereco,
    numero: data.numero,
    complemento: data.complemento,
    telefone: data.telefone,
    email: data.email,
    logo: data.logo,
  });
  const updated = response.data?.data || response.data;
  return {
    nome: updated.nome || "",
    tipoDocumento: updated.tipoDocumento || "CPF",
    documento: updated.documento || "",
    numero: updated.numero || "",
    complemento: updated.complemento || "",
    endereco: updated.endereco || "",
    telefone: updated.telefone || "",
    email: updated.email || "",
    logo: updated.logo || "",
  };
}