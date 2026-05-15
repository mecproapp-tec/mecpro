export interface User {
  id: string;
  email: string;
  officeName?: string;
  status: "active" | "inactive" | "blocked" | "temporarily_blocked";
  paymentStatus: "paid" | "overdue";
  lastLogin?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  target: "all" | "specific";
  userIds?: string[];
  sentAt: string;
}
