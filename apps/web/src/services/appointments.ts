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

function normalizeDate(date: string): string {
  if (!date) return date;
  if (date.includes("Z")) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  }
  return date;
}

export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get("/appointments");
  const lista = normalizeArray<Appointment>(response.data);
  return lista.map((app) => ({
    ...app,
    date: normalizeDate(app.date),
  }));
};

export const getAppointmentById = async (id: number): Promise<Appointment> => {
  const response = await api.get(`/appointments/${id}`);
  const data = response.data?.data || response.data;
  return { ...data, date: normalizeDate(data.date) };
};

export const createAppointment = async (data: { clientId: number; date: string; comment?: string }): Promise<Appointment> => {
  const response = await api.post("/appointments", {
    ...data,
    date: normalizeDate(data.date),
  });
  return response.data?.data || response.data;
};

export const updateAppointment = async (id: number, data: { clientId: number; date: string; comment?: string }): Promise<Appointment> => {
  const response = await api.put(`/appointments/${id}`, {
    ...data,
    date: normalizeDate(data.date),
  });
  return response.data?.data || response.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};