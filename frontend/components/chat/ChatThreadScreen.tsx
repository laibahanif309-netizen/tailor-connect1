import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Keyboard,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import type { Socket } from 'socket.io-client';
import { Text } from '../ui/text';
import { MessageBubble } from '../common/MessageBubble';
import { TypingIndicatorRow } from './TypingIndicatorRow';
import { getAuthToken, getErrorMessage } from '../../services/api';
import { getUserData } from '../../services/auth';
import {
  connectChatSocket,
  emitSendMessage,
  emitStopTyping,
  emitTyping,
  fetchConversationDetail,
  fetchMessages,
  markConversationRead,
  sendMessageRest,
  uploadChatImage,
} from '../../services/chat';
import type { ConversationDetail, Message } from '../../types/chat';
import { useToast } from '../../utils/toast';
import { refreshChatUnreadBadgeCount } from '../../hooks/useChatUnreadBadgeSync';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Shared chat thread: REST load + Socket.io send/receive, image upload, mark read.
 */
export function ChatThreadScreen() {
  const params = useLocalSearchParams<{ id: string; title?: string }>();
  const conversationId = normalizeParam(params.id);
  const titleFallback = normalizeParam(params.title);
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildChatThreadStyles(t), [t]);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const listRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const { showError } = useToast();

  useEffect(() => {
    getUserData().then((u) => {
      const id = u?.id ?? null;
      currentUserIdRef.current = id;
      setCurrentUserId(id);
    });
  }, []);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const appendMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (seenMessageIdsRef.current.has(msg.id)) return prev;
      seenMessageIdsRef.current.add(msg.id);
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const replaceOptimistic = useCallback((tempId: string, real: Message) => {
    seenMessageIdsRef.current.delete(tempId);
    seenMessageIdsRef.current.add(real.id);
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === tempId ? real : m));
      const byId = new Map(next.map((m) => [m.id, m]));
      return Array.from(byId.values());
    });
  }, []);

  const removeOptimistic = useCallback((tempId: string) => {
    seenMessageIdsRef.current.delete(tempId);
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  const loadData = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    seenMessageIdsRef.current.clear();
    try {
      const [conv, msgs] = await Promise.all([
        fetchConversationDetail(
          conversationId,
          titleFallback ? safeDecodeURIComponent(titleFallback) : undefined
        ),
        fetchMessages(conversationId, { page: 1, limit: 80 }),
      ]);
      setConversation(conv ?? null);
      setMessages(msgs);
      msgs.forEach((m) => seenMessageIdsRef.current.add(m.id));
      try {
        await markConversationRead(conversationId);
        void refreshChatUnreadBadgeCount();
      } catch (err) {
        console.warn('markConversationRead', err);
      }
    } catch (e) {
      console.error('Chat load error:', e);
      showError('Could not load chat');
    } finally {
      setLoading(false);
    }
  }, [conversationId, titleFallback, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!conversationId) {
      router.back();
    }
  }, [conversationId]);

  const handleIncomingMessage = useCallback(
    (payload: { conversationId: string; message: Message }) => {
      if (payload.conversationId !== conversationId) return;
      appendMessage(payload.message);
    },
    [conversationId, appendMessage]
  );

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      const token = await getAuthToken();
      if (!token || cancelled) return;
      socket = connectChatSocket(token, {
        onMessageReceived: handleIncomingMessage,
        onNewMessage: handleIncomingMessage,
        onMessageRead: ({ conversationId: cid, readBy }) => {
          if (cid !== conversationId || readBy !== currentUserIdRef.current) return;
          void refreshChatUnreadBadgeCount();
        },
        onTyping: ({ conversationId: cid, userId }) => {
          if (cid !== conversationId || userId === currentUserIdRef.current) return;
          setOtherTyping(true);
          if (typingStopRef.current) clearTimeout(typingStopRef.current);
          typingStopRef.current = setTimeout(() => setOtherTyping(false), 3000);
        },
        onStopTyping: ({ conversationId: cid, userId }) => {
          if (cid !== conversationId || userId === currentUserIdRef.current) return;
          setOtherTyping(false);
        },
      });
      socketRef.current = socket;
    })();

    return () => {
      cancelled = true;
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      if (typingStopRef.current) clearTimeout(typingStopRef.current);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, handleIncomingMessage]);

  const flushTyping = useCallback(() => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    emitStopTyping(socketRef.current, conversationId ?? '');
  }, [conversationId]);

  const onInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (!conversationId || !socketRef.current?.connected) return;
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        emitTyping(socketRef.current, conversationId);
      }, 400);
    },
    [conversationId]
  );

  const sendText = useCallback(() => {
    const text = inputText.trim();
    if (!text || !conversationId || !currentUserId) return;

    const tempId = `local-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      type: 'text',
      content: text,
      createdAt: new Date(),
      isRead: false,
    };
    appendMessage(optimistic);
    setInputText('');
    flushTyping();

    const payload = {
      conversationId,
      messageType: 'text' as const,
      content: text,
    };

    emitSendMessage(socketRef.current, payload, async (res) => {
      if (res.ok && res.message) {
        replaceOptimistic(tempId, res.message);
        return;
      }
      try {
        const saved = await sendMessageRest({
          conversationId,
          messageType: 'text',
          content: text,
        });
        replaceOptimistic(tempId, saved);
      } catch (e) {
        console.error('send text', e);
        removeOptimistic(tempId);
        showError('Message failed to send');
      }
    });

    setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
  }, [
    inputText,
    conversationId,
    currentUserId,
    appendMessage,
    replaceOptimistic,
    removeOptimistic,
    flushTyping,
    showError,
  ]);

  const pickAndSendImage = useCallback(async () => {
    if (!conversationId || !currentUserId || sendingImage) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError('Photo library permission is required');
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (pick.canceled || !pick.assets[0]) return;

    const asset = pick.assets[0];
    const uri = asset.uri;
    const mime = asset.mimeType ?? 'image/jpeg';

    setSendingImage(true);
    try {
      const imageUrl = await uploadChatImage(uri, mime);
      const tempId = `local-img-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        type: 'image',
        content: null,
        imageUrl,
        createdAt: new Date(),
        isRead: false,
      };
      appendMessage(optimistic);

      emitSendMessage(
        socketRef.current,
        {
          conversationId,
          messageType: 'image',
          imageUrl,
        },
        async (res) => {
          if (res.ok && res.message) {
            replaceOptimistic(tempId, res.message);
            return;
          }
          try {
            const saved = await sendMessageRest({
              conversationId,
              messageType: 'image',
              imageUrl,
            });
            replaceOptimistic(tempId, saved);
          } catch (e) {
            console.error('send image', e);
            removeOptimistic(tempId);
            showError('Image failed to send');
          }
        }
      );
    } catch (e) {
      console.error('upload image', e);
      showError(getErrorMessage(e) || 'Could not upload image');
    } finally {
      setSendingImage(false);
    }
  }, [
    conversationId,
    currentUserId,
    sendingImage,
    appendMessage,
    replaceOptimistic,
    removeOptimistic,
    showError,
  ]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        type={item.type}
        content={item.content}
        imageUrl={item.imageUrl}
        createdAt={item.createdAt}
        isSent={currentUserId != null && item.senderId === currentUserId}
        read={!!(item.readAt ?? item.isRead)}
        onImagePress={item.type === 'image' ? (uri) => setLightboxUri(uri) : undefined}
      />
    ),
    [currentUserId]
  );

  if (!conversationId) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.headerName}>Chat</Text>
        </View>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Conversation not found</Text>
        </View>
      </View>
    );
  }

  const typingLabel = conversation.participantName.split(/\s+/)[0] ?? '';
  const canSend = inputText.trim().length > 0 && !!currentUserId;

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1D3A5F" />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(conversation.participantName)}</Text>
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerName} numberOfLines={1}>
              {conversation.participantName}
            </Text>
            <Text style={styles.headerStatus}>
              {conversation.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <Pressable style={({ pressed }) => [styles.moreBtn, pressed && styles.backBtnPressed]}>
          <MaterialCommunityIcons name="dots-vertical" size={22} color={t.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.keyboardView}>
        <FlatList
          ref={listRef}
          data={[...messages].reverse()}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <TypingIndicatorRow visible={otherTyping} label={typingLabel} />

        <View style={[styles.inputBar, { marginBottom: keyboardHeight }]}>
          <Pressable
            onPress={pickAndSendImage}
            disabled={sendingImage || !currentUserId}
            style={({ pressed }) => [
              styles.attachBtn,
              (sendingImage || !currentUserId) && styles.attachBtnDisabled,
              pressed && styles.backBtnPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="image-outline"
              size={24}
              color={sendingImage || !currentUserId ? t.textMuted : t.textPrimary}
            />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={t.textMuted}
            value={inputText}
            onChangeText={onInputChange}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={sendText}
            disabled={!canSend}
            style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
          >
            <MaterialCommunityIcons
              name="send"
              size={22}
              color={canSend ? '#FFFFFF' : t.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
        statusBarTranslucent
      >
        <View style={styles.lightboxRoot}>
          <StatusBar barStyle="light-content" />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setLightboxUri(null)} />
          <View style={styles.lightboxContent} pointerEvents="box-none">
            <Pressable
              style={({ pressed }) => [styles.lightboxClose, pressed && styles.backBtnPressed]}
              onPress={() => setLightboxUri(null)}
              hitSlop={16}
            >
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </Pressable>
            {lightboxUri ? (
              <Image
                source={{ uri: lightboxUri }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function buildChatThreadStyles(t: AppScreenTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: t.screenBg,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: t.screenBg,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: t.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.headerBorder,
    backgroundColor: t.headerBg,
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: t.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitles: {
    marginLeft: 12,
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: t.textPrimary,
  },
  headerStatus: {
    fontSize: 13,
    color: t.textSecondary,
    marginTop: 1,
  },
  moreBtn: {
    padding: 8,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: t.screenBg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: t.headerBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.headerBorder,
    gap: 4,
  },
  attachBtn: {
    padding: 8,
    marginBottom: 4,
  },
  attachBtnDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: t.isDark ? t.menuIconBg : t.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 16,
    color: t.inputText,
    borderWidth: 1,
    borderColor: t.cardBorder,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendBtnActive: {
    backgroundColor: t.gold,
  },
  sendBtnDisabled: {
    backgroundColor: t.isDark ? t.menuIconBg : t.divider,
  },
  lightboxRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  lightboxContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  lightboxClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 12,
    zIndex: 2,
    padding: 8,
  },
  lightboxImage: {
    width: '100%',
    height: Math.min(Dimensions.get('window').height * 0.78, 900),
  },
  });
}
