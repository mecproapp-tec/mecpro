import api from "./api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  appointmentId?: number;
  appointment?: any;
}

export const getNotifications = async (page = 1, limit = 50): Promise<{ data: Notification[]; total: number; page: number; limit: number; totalPages: number }> => {
  const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

export const markAsRead = async (id: number): Promise<Notification> => {
  const response = await api.post(`/notifications/${id}/mark-read`);
  return response.data.data;
};

export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/mark-all-read');
};

export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

export const createNotification = async (title: string, message: string): Promise<Notification> => {
  const response = await api.post('/notifications', { title, message });
  return response.data.data;
};