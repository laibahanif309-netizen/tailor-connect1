import { create } from 'zustand';

type NotificationBadgeState = {
  unreadCount: number;
  setNotificationUnreadCount: (n: number) => void;
};

export const useNotificationBadgeStore = create<NotificationBadgeState>((set) => ({
  unreadCount: 0,
  setNotificationUnreadCount: (n) => set({ unreadCount: Math.max(0, Math.floor(n)) }),
}));
