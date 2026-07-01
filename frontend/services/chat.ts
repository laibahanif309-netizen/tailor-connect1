/**
 * Chat API + Socket.io (Phase 5)
 */

import * as FileSystem from 'expo-file-system';
import { io, type Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { apiGet, apiPatch, apiPost, getApiBaseUrl, getAuthToken, getSocketBaseUrl, ApiException } from './api';
import type { ConversationDetail, ConversationListItem, Message } from '../types/chat';

// --- API shapes (backend) ---

interface ApiParticipant {
  id: string;
  fullName: string | null;
  username: string | null;
  email: string;
  profileImageUrl?: string | null;
  role: string;
  businessName?: string | null;
}

interface ApiLastMessage {
  id: string;
  content: string | null;
  type: string;
  imageUrl?: string | null;
  createdAt: string;
  senderId: string;
}

interface ApiConversationRow {
  id: string;
  participant: ApiParticipant | null;
  lastMessage: ApiLastMessage | null;
  unreadCount: number;
  updatedAt: string;
  lastMessageAt: string | null;
  isOnline: boolean;
  order?: { id: string; orderNumber: string } | null;
}

interface ApiMessagesPayload {
  messages: Message[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function participantDisplayName(p: ApiParticipant | null): string {
  if (!p) return 'Chat';
  return p.fullName || p.username || p.email.split('@')[0] || 'User';
}

function previewLastMessage(last: ApiLastMessage | null): string {
  if (!last) return '';
  if (last.type === 'image') return '📷 Photo';
  return (last.content || '').trim();
}

function mapConversationRow(row: ApiConversationRow): ConversationListItem {
  const p = row.participant;
  return {
    id: row.id,
    participantName: participantDisplayName(p),
    participantAvatar: p?.profileImageUrl ?? undefined,
    lastMessage: previewLastMessage(row.lastMessage),
    updatedAt: row.lastMessageAt || row.updatedAt,
    unreadCount: row.unreadCount,
    isOnline: row.isOnline
  };
}

export async function fetchConversations(): Promise<ConversationListItem[]> {
  const { data } = await apiGet<{ conversations: ApiConversationRow[] }>('/conversations');
  return (data.conversations ?? []).map(mapConversationRow);
}

/** @deprecated use fetchConversations */
export const getTailorConversations = fetchConversations;

export async function fetchConversationDetail(
  conversationId: string,
  titleFallback?: string
): Promise<ConversationDetail | null> {
  const { data } = await apiGet<{ conversations: ApiConversationRow[] }>('/conversations');
  const row = data.conversations?.find((c) => c.id === conversationId);
  if (!row) {
    if (titleFallback) {
      return {
        id: conversationId,
        participantName: titleFallback,
        isOnline: false
      };
    }
    return null;
  }
  const p = row.participant;
  return {
    id: row.id,
    participantName: participantDisplayName(p),
    participantAvatar: p?.profileImageUrl ?? undefined,
    isOnline: row.isOnline
  };
}

/** @deprecated use fetchConversationDetail */
export const getConversationById = fetchConversationDetail;

export async function fetchMessages(
  conversationId: string,
  params?: { page?: number; limit?: number }
): Promise<Message[]> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  const path = `/conversations/${encodeURIComponent(conversationId)}/messages${qs ? `?${qs}` : ''}`;
  const { data } = await apiGet<ApiMessagesPayload>(path);
  return data.messages ?? [];
}

/** @deprecated use fetchMessages */
export const getMessagesByConversationId = (conversationId: string) =>
  fetchMessages(conversationId, { page: 1, limit: 80 });

export async function sendMessageRest(payload: {
  conversationId: string;
  messageType: 'text' | 'image';
  content?: string;
  imageUrl?: string;
}): Promise<Message> {
  const { data } = await apiPost<Message>('/messages', payload);
  return data;
}

export async function markConversationRead(conversationId: string): Promise<number> {
  const { data } = await apiPatch<{ marked: number }>(
    `/conversations/${encodeURIComponent(conversationId)}/read`,
    {}
  );
  return data.marked ?? 0;
}

export async function ensureConversationFromOrder(orderId: string): Promise<string> {
  const { data } = await apiPost<{ conversation: { id: string } }>('/conversations/from-order', {
    orderId
  });
  return data.conversation.id;
}

function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'image/gif') return '.gif';
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return '.heic';
  return '.jpg';
}

/**
 * Android (and sometimes iOS) pickers return `content://` or `ph://` URIs. RN's multipart
 * `fetch` often fails with "Network request failed" unless the file is readable as `file://`.
 */
async function resolveUriForMultipartUpload(
  localUri: string,
  mimeType: string
): Promise<{ uri: string; cleanup?: () => Promise<void> }> {
  if (Platform.OS === 'web') {
    return { uri: localUri };
  }
  if (localUri.startsWith('file://')) {
    return { uri: localUri };
  }
  const baseDir = FileSystem.cacheDirectory;
  if (!baseDir) {
    return { uri: localUri };
  }
  const ext = extensionForMime(mimeType);
  const dest = `${baseDir}chat-upload-${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`;
  await FileSystem.copyAsync({ from: localUri, to: dest });
  return {
    uri: dest,
    cleanup: () => FileSystem.deleteAsync(dest, { idempotent: true })
  };
}

/**
 * RN's `fetch` + multipart often throws "Network request failed" on device even when JSON
 * API calls work. XMLHttpRequest handles the same FormData reliably.
 */
function postMultipartNative(url: string, form: FormData, token: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 120_000;
    xhr.onload = () => {
      if (xhr.status === 0) {
        reject(new TypeError('Network request failed'));
        return;
      }
      resolve(
        new Response(typeof xhr.responseText === 'string' ? xhr.responseText : '', {
          status: xhr.status,
          statusText: xhr.statusText || undefined
        })
      );
    };
    xhr.onerror = () => reject(new TypeError('Network request failed'));
    xhr.ontimeout = () => reject(new TypeError('Network request failed'));
    xhr.send(form as never);
  });
}

/**
 * Multipart upload — field name `image` (matches backend multer).
 */
export async function uploadChatImage(localUri: string, mimeType = 'image/jpeg'): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new ApiException('Not signed in', 401);

  const { uri: uploadUri, cleanup } = await resolveUriForMultipartUpload(localUri, mimeType);
  const name = uploadUri.split('/').pop()?.split('?')[0] || 'photo.jpg';

  const form = new FormData();
  form.append('image', { uri: uploadUri, name, type: mimeType } as unknown as Blob);

  const url = `${getApiBaseUrl().replace(/\/+$/, '')}/messages/upload-image`;

  try {
    let response: Response;
    try {
      response =
        Platform.OS === 'web'
          ? await fetch(url, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: form
            })
          : await postMultipartNative(url, form, token);
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Network request failed') {
        throw new ApiException(
          `Could not reach server for image upload. Check ${getApiBaseUrl()} and that the backend is running.`,
          0
        );
      }
      throw e;
    }

    const text = await response.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        throw new ApiException('Invalid server response', response.status);
      }
    }

    if (!response.ok) {
      const b = body as { message?: string };
      throw new ApiException(b.message || 'Upload failed', response.status);
    }

    if (body && typeof body === 'object' && 'success' in body && body.success === true && 'data' in body) {
      const d = (body as { data: { imageUrl: string } }).data;
      return d.imageUrl;
    }

    throw new ApiException('Unexpected upload response', response.status);
  } finally {
    await cleanup?.();
  }
}

export type NotificationSocketPayload = {
  notification: {
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
    actor?: { id: string; name: string; profileImageUrl?: string };
  };
};

export type ChatSocketHandlers = {
  onMessageReceived?: (payload: { conversationId: string; message: Message }) => void;
  /** Same payload as `message_received`; server also emits `new_message` for spec parity. */
  onNewMessage?: (payload: { conversationId: string; message: Message }) => void;
  onConversationUpdated?: (payload: { conversationId: string }) => void;
  onMessageRead?: (payload: { conversationId: string; readBy: string; count?: number }) => void;
  onTyping?: (payload: { conversationId: string; userId: string }) => void;
  onStopTyping?: (payload: { conversationId: string; userId: string }) => void;
  /** Server pushes after creating a notification for this user (Phase 8). */
  onNewNotification?: (payload: NotificationSocketPayload) => void;
};

/**
 * Connect authenticated Socket.io client. Caller must disconnect on unmount.
 */
export function connectChatSocket(token: string, handlers: ChatSocketHandlers): Socket {
  const socket: Socket = io(getSocketBaseUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 8
  });

  if (handlers.onMessageReceived) {
    socket.on('message_received', handlers.onMessageReceived);
  }
  if (handlers.onNewMessage) {
    socket.on('new_message', handlers.onNewMessage);
  }
  if (handlers.onConversationUpdated) {
    socket.on('conversation_updated', handlers.onConversationUpdated);
  }
  if (handlers.onMessageRead) {
    socket.on('message_read', handlers.onMessageRead);
  }
  if (handlers.onTyping) {
    socket.on('typing', handlers.onTyping);
  }
  if (handlers.onStopTyping) {
    socket.on('stop_typing', handlers.onStopTyping);
  }
  if (handlers.onNewNotification) {
    socket.on('new_notification', handlers.onNewNotification);
  }

  return socket;
}

export function emitSendMessage(
  socket: Socket | null,
  payload: {
    conversationId: string;
    messageType: 'text' | 'image';
    content?: string;
    imageUrl?: string;
  },
  ack?: (result: { ok: boolean; message?: Message; error?: string }) => void
): void {
  if (!socket?.connected) {
    ack?.({ ok: false, error: 'Socket not connected' });
    return;
  }
  socket.emit('send_message', payload, (res: unknown) => {
    if (res && typeof res === 'object' && 'ok' in res) {
      ack?.(res as { ok: boolean; message?: Message; error?: string });
    } else {
      ack?.({ ok: true });
    }
  });
}

export function emitTyping(socket: Socket | null, conversationId: string): void {
  socket?.emit('typing', { conversationId });
}

export function emitStopTyping(socket: Socket | null, conversationId: string): void {
  socket?.emit('stop_typing', { conversationId });
}

/** Legacy mock id — use real user id from getUserData().id */
export const TAILOR_USER_ID = '';
