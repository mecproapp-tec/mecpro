import api from "./api";
import { normalizeArray } from "../utils/normalizeArray";

export interface Appointment {
  id: number;
  clientId: number;
  date: string;
  comment?: string;
  client?: {
    id: number;
    name: string;
    phone?: string;
    vehicle?: string;
    plate?: string;
  };
}

// 🔥 CORREÇÃO #44: Remover normalizeDate problemático
// Agora usamos a data diretamente do backend (UTC) e formatamos na exibição

export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get("/appointments");
  const lista = normalizeArray<Appointment>(response.data);
  // ✅ Não modificar a data, manter como está do backend
  return lista;
};

export const getAppointmentById = async (id: number): Promise<Appointment> => {
  const response = await api.get(`/appointments/${id}`);
  const data = response.data?.data || response.data;
  // ✅ Não modificar a data
  return data;
};

export const createAppointment = async (data: { clientId: number; date: string; comment?: string }): Promise<Appointment> => {
  // ✅ Enviar a data no formato ISO (UTC)
  const dateToSend = data.date.includes('Z') ? data.date : new Date(data.date).toISOString();
  const response = await api.post("/appointments", {
    ...data,
    date: dateToSend,
  });
  return response.data?.data || response.data;
};

export const updateAppointment = async (id: number, data: { clientId: number; date: string; comment?: string }): Promise<Appointment> => {
  const dateToSend = data.date.includes('Z') ? data.date : new Date(data.date).toISOString();
  const response = await api.put(`/appointments/${id}`, {
    ...data,
    date: dateToSend,
  });
  return response.data?.data || response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};