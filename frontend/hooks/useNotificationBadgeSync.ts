import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getAuthToken } from '../services/api';
import { fetchNotifications } from '../services/notifications';
import { useNotificationBadgeStore } from '../store/notificationBadge';

export async function refreshNotificationBadgeCount(): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    useNotificationBadgeStore.getState().setNotificationUnreadCount(0);
    return;
  }
  try {
    const data = await fetchNotifications({ page: 1, limit: 1 });
    useNotificationBadgeStore.getState().setNotificationUnreadCount(data.unreadCount ?? 0);
  } catch {
    /* keep previous count */
  }
}

/**
 * Keeps tab bar badge in sync: initial fetch, app foreground, and periodic refresh.
 */
export function useNotificationBadgeSync(): void {
  useEffect(() => {
    void refreshNotificationBadgeCount();
    const interval = setInterval(() => void refreshNotificationBadgeCount(), 20_000);
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void refreshNotificationBadgeCount();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
