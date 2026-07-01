import { apiGet, apiPatch, apiPost } from './api';
import type { NotificationItem, NotificationsListResponse } from '../types/notification';

function buildQuery(params?: { page?: number; limit?: number; unreadOnly?: boolean }): string {
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.unreadOnly === true) q.set('unreadOnly', 'true');
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsListResponse> {
  const { data } = await apiGet<NotificationsListResponse>(`/notifications${buildQuery(params)}`);
  return data;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const { data } = await apiPatch<{ notification: NotificationItem }>(
    `/notifications/${encodeURIComponent(id)}/read`,
    {}
  );
  return data.notification;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await apiPost<{ updated: number }>('/notifications/mark-all-read', {});
  return data.updated ?? 0;
}
