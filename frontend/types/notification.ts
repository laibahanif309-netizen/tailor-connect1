export interface NotificationActorBrief {
  id: string;
  name: string;
  profileImageUrl?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  metadata?: unknown;
  createdAt: string;
  actor?: NotificationActorBrief;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}
