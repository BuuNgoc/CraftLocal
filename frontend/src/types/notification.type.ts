export type NotificationType =
  | 'BOOKING'
  | 'ORDER'
  | 'PAYMENT'
  | 'SYSTEM'
  | 'REVIEW'
  | 'TIMESLOT'
  | 'HOST_APPLICATION'
  | 'CHECK_IN';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedType?: string;
  relatedId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
