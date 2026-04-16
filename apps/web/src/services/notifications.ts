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
  return normalizeArray<Notification>(response.data);
};

export const markAsRead = async (id: number): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};