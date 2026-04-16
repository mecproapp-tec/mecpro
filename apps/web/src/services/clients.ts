import api from "./api";
import { normalizeArray } from "../utils/normalizeArray";

export interface Client {
  id: number;
  name: string;
  vehicle?: string;
  plate?: string;
  phone?: string;
  email?: string;
  address?: string;
  document?: string;
}

export async function getClients(): Promise<Client[]> {
  const response = await api.get("/clients");
  return normalizeArray<Client>(response.data);
}

export async function getClientById(id: number): Promise<Client> {
  const response = await api.get(`/clients/${id}`);
  return response.data?.data || response.data;
}

export async function createClient(clientData: Omit<Client, "id">): Promise<Client> {
  const response = await api.post("/clients", clientData);
  return response.data?.data || response.data;
}

export async function updateClient(id: number, clientData: Partial<Client>): Promise<Client> {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data?.data || response.data;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}

export function getVehicleDisplay(client: Client): string {
  if (!client.vehicle && !client.plate) return "Não informado";
  return `${client.vehicle || ""} ${client.plate || ""}`.trim();
}