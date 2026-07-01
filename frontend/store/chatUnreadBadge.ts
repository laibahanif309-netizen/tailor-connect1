import { create } from 'zustand';

type ChatUnreadBadgeState = {
  totalUnread: number;
  setChatUnreadTotal: (n: number) => void;
};

export const useChatUnreadBadgeStore = create<ChatUnreadBadgeState>((set) => ({
  totalUnread: 0,
  setChatUnreadTotal: (n) => set({ totalUnread: Math.max(0, Math.floor(n)) }),
}));
