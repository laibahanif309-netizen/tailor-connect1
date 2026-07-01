/**
 * Chat list and thread types (aligned with GET /api/conversations + messages)
 */

export interface ConversationListItem {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  updatedAt: Date | string;
  unreadCount: number;
  isOnline?: boolean;
}

/** Header state for chat thread */
export interface ConversationDetail {
  id: string;
  participantName: string;
  participantAvatar?: string;
  isOnline?: boolean;
}

export type ChatMessageType = 'text' | 'image';

/** Message row from API (GET messages / socket payload) */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: ChatMessageType;
  content: string | null;
  imageUrl?: string | null;
  createdAt: Date | string;
  readAt?: Date | string | null;
  isRead?: boolean;
}
