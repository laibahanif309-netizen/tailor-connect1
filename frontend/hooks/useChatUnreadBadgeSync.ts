import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { getAuthToken } from '../services/api';
import { fetchConversations } from '../services/chat';
import type { ConversationListItem } from '../types/chat';
import { useChatUnreadBadgeStore } from '../store/chatUnreadBadge';

export function syncChatUnreadFromList(list: ConversationListItem[]): void {
  const total = list.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  useChatUnreadBadgeStore.getState().setChatUnreadTotal(total);
}

export async function refreshChatUnreadBadgeCount(): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    useChatUnreadBadgeStore.getState().setChatUnreadTotal(0);
    return;
  }
  try {
    const list = await fetchConversations();
    syncChatUnreadFromList(list);
  } catch {
    /* keep previous */
  }
}

/**
 * Tab bar chat badge: initial + foreground + periodic refresh (matches notification badge pattern).
 */
export function useChatUnreadBadgeSync(): void {
  useEffect(() => {
    void refreshChatUnreadBadgeCount();
    const interval = setInterval(() => void refreshChatUnreadBadgeCount(), 20_000);
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') void refreshChatUnreadBadgeCount();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);
}
