import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Socket } from 'socket.io-client';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { EmptyState } from '../common/EmptyState';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/notifications';
import type { NotificationItem } from '../../types/notification';
import { getAuthToken, getErrorMessage } from '../../services/api';
import { connectChatSocket } from '../../services/chat';
import { useNotificationBadgeStore } from '../../store/notificationBadge';
import { useToast } from '../../utils/toast';
import { format } from 'date-fns';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

const PAGE_SIZE = 30;

/** Zustand must not update during a React `setState` functional updater (cross-tree render warning). */
function scheduleNotificationBadgeSync(nextUnread: number) {
  setTimeout(() => {
    useNotificationBadgeStore.getState().setNotificationUnreadCount(nextUnread);
  }, 0);
}

export default function NotificationsListScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildNotificationListStyles(t), [t]);

  const { showError, showSuccess } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications({ page: 1, limit: PAGE_SIZE });
      setItems(data.notifications);
      const nextUnread = data.unreadCount ?? 0;
      setUnreadCount(nextUnread);
      useNotificationBadgeStore.getState().setNotificationUnreadCount(nextUnread);
    } catch (e: unknown) {
      showError('Notifications', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchNotifications({ page: 1, limit: PAGE_SIZE });
      setItems(data.notifications);
      const nextUnread = data.unreadCount ?? 0;
      setUnreadCount(nextUnread);
      useNotificationBadgeStore.getState().setNotificationUnreadCount(nextUnread);
    } catch (e: unknown) {
      showError('Notifications', getErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAuthToken();
      if (!token || cancelled) return;
      const socket = connectChatSocket(token, {
        onNewNotification: (payload) => {
          const n = payload.notification;
          setItems((prev) => {
            if (prev.some((x) => x.id === n.id)) return prev;
            return [n as NotificationItem, ...prev];
          });
          if (!n.isRead) {
            setUnreadCount((c) => {
              const next = c + 1;
              scheduleNotificationBadgeSync(next);
              return next;
            });
          }
        },
      });
      socketRef.current = socket;
    })();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const onPressItem = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      const updated = await markNotificationRead(item.id);
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setUnreadCount((c) => {
        const next = Math.max(0, c - 1);
        scheduleNotificationBadgeSync(next);
        return next;
      });
    } catch (e: unknown) {
      showError('Notifications', getErrorMessage(e));
    }
  };

  const onMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      showSuccess('Done', 'All notifications marked as read.');
      await onRefresh();
    } catch (e: unknown) {
      showError('Notifications', getErrorMessage(e));
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={t.gold} />
        <Text style={styles.muted}>Loading notifications…</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 ? (
            <Text style={styles.sub}>{unreadCount} unread</Text>
          ) : (
            <Text style={styles.sub}>{"You're all caught up"}</Text>
          )}
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => void onMarkAll()}
            disabled={markingAll}
            style={[styles.markAllBtn, markingAll && styles.markAllDisabled]}
          >
            <Text style={styles.markAllText}>{markingAll ? '…' : 'Mark all read'}</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="bell-outline"
            title="No notifications"
            subtitle="Order updates, messages, and bookings will show up here."
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={t.gold} />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => void onPressItem(item)}>
              <Card style={[styles.card, !item.isRead && styles.cardUnread]}>
                <View style={styles.rowTop}>
                  <MaterialCommunityIcons
                    name={iconForType(item.type) as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                    size={22}
                    color={item.isRead ? t.textMuted : t.gold}
                  />
                  {!item.isRead ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
                <Text style={styles.date}>{format(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')}</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function iconForType(type: string): string {
  switch (type) {
    case 'order_placed':
    case 'order_status_changed':
      return 'clipboard-text-outline';
    case 'new_message':
      return 'message-text-outline';
    case 'review_received':
      return 'star-outline';
    case 'booking_requested':
    case 'booking_confirmed':
      return 'calendar-clock';
    default:
      return 'bell-outline';
  }
}

function buildNotificationListStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.screenBg },
    muted: { marginTop: 10, fontSize: 14, color: t.textSecondary },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: { fontSize: 22, fontWeight: '700', color: t.textPrimary },
    sub: { fontSize: 13, color: t.textSecondary, marginTop: 4 },
    markAllBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.gold,
      backgroundColor: t.markAllBg,
    },
    markAllDisabled: { opacity: 0.5 },
    markAllText: { fontSize: 13, fontWeight: '700', color: t.markAllText },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    card: {
      padding: 14,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
      backgroundColor: t.cardBg,
    },
    cardUnread: {
      borderColor: t.cardUnreadBorder,
      backgroundColor: t.cardUnreadBg,
    },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.gold,
      marginTop: 4,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 4 },
    cardBody: { fontSize: 14, color: t.cardBody, lineHeight: 20 },
    date: { fontSize: 12, color: t.textMuted, marginTop: 8 },
    emptyWrap: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
  });
}
