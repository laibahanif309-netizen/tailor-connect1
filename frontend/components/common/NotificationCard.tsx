import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Card } from '../ui/card';
import { VStack } from '../ui/vstack';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Notification, NotificationType } from '../../types/notification';
import { format, isToday, isYesterday } from 'date-fns';

const ICON_BY_TYPE: Record<NotificationType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  order_placed: 'clipboard-text',
  order_status_changed: 'clipboard-text',
  new_message: 'message',
  review_received: 'star',
  booking_requested: 'calendar',
  booking_confirmed: 'calendar',
};

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

/**
 * NotificationCard - Card for a single notification with type icon, title, body, time, unread indicator
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const dateObj =
    typeof notification.createdAt === 'string'
      ? new Date(notification.createdAt)
      : notification.createdAt;
  const timeLabel = isToday(dateObj)
    ? format(dateObj, 'h:mm a')
    : isYesterday(dateObj)
      ? `Yesterday, ${format(dateObj, 'h:mm a')}`
      : format(dateObj, 'MMM d, h:mm a');

  const iconName = ICON_BY_TYPE[notification.type];

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={[styles.card, !notification.read && styles.cardUnread]}>
        <HStack space="md" alignItems="flex-start" style={styles.row}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color="#C9A227"
            />
          </View>
          <VStack style={styles.content} space="xs">
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, !notification.read && styles.titleUnread]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text
              style={styles.body}
              numberOfLines={2}
            >
              {notification.body}
            </Text>
            <Text style={styles.time}>{timeLabel}</Text>
          </VStack>
        </HStack>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardUnread: {
    backgroundColor: '#F5F6F8',
  },
  row: {
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3A5F',
  },
  titleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A227',
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

NotificationCard.displayName = 'NotificationCard';
