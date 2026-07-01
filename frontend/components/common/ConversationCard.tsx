import React, { useMemo } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Text } from '../ui/text';
import type { ConversationListItem } from '../../types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

const MAX_LAST_MESSAGE_LENGTH = 45;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

interface ConversationCardProps {
  conversation: ConversationListItem;
  onPress: () => void;
}

/**
 * ConversationCard – WhatsApp-style list item: avatar, name + time/badge on one row, message preview below
 */
export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onPress,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildConversationCardStyles(t), [t]);
  const { participantName, participantAvatar, lastMessage, updatedAt, unreadCount } =
    conversation;
  const truncatedMessage =
    lastMessage.length > MAX_LAST_MESSAGE_LENGTH
      ? lastMessage.slice(0, MAX_LAST_MESSAGE_LENGTH) + '…'
      : lastMessage;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.avatarWrapper}>
        {participantAvatar ? (
          <View style={[styles.avatar, styles.avatarImage]} />
        ) : (
          <View style={[styles.avatar, styles.avatarInitials]}>
            <Text style={styles.initials}>{getInitials(participantName)}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        {/* Row 1: Name (left) | Time + Unread badge (right) */}
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {participantName}
          </Text>
          <View style={styles.rightMeta}>
            <Text style={[styles.timestamp, unreadCount > 0 && styles.timestampUnread]}>
              {formatTimestamp(updatedAt)}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Row 2: Last message preview only */}
        <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
          {truncatedMessage}
        </Text>
      </View>
    </Pressable>
  );
};

function buildConversationCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: t.cardBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
    },
    rowPressed: {
      backgroundColor: t.isDark ? '#334155' : '#F5F6F8',
    },
    avatarWrapper: {
      marginRight: 12,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
    },
    avatarImage: {
      backgroundColor: t.divider,
    },
    avatarInitials: {
      backgroundColor: t.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    name: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
      marginRight: 8,
    },
    rightMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timestamp: {
      fontSize: 12,
      color: t.textMuted,
    },
    timestampUnread: {
      color: t.gold,
      fontWeight: '500',
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#25D366',
      marginLeft: 6,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadCount: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    lastMessage: {
      fontSize: 14,
      color: t.textSecondary,
    },
    lastMessageUnread: {
      color: t.textPrimary,
      fontWeight: '500',
    },
  });
}

ConversationCard.displayName = 'ConversationCard';
