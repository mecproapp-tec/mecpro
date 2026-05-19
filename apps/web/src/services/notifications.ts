import api from "./api";
import { normalizeArray } from "../utils/normalizeArray";

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  appointmentId?: number;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get("/notifications");
  const data = response.data?.data || response.data;
  return normalizeArray<Notification>(data);
};

export const markAsRead = async (id: number): Promise<void> => {
  await api.post(`/notifications/${id}/mark-read`);
};

export const markAllAsRead = async (): Promise<{ count: number }> => {
  const response = await api.post("/notifications/mark-all-read");
  return response.data;
};

// 🔥 NOVA: excluir uma notificação
export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

// 🔥 NOVA: excluir todas as notificações lidas
export const deleteAllReadNotifications = async (): Promise<{ count: number }> => {
  const response = await api.delete("/notifications/read/all");
  return response.data;
};