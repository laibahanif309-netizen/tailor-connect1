import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useChatUnreadBadgeStore } from '../../store/chatUnreadBadge';

type Props = {
  color: string;
  size?: number;
};

/**
 * Chat tab icon with total unread pill (sum of per-thread unreads). Matches list badge styling.
 */
export function TabBarChatIcon({ color, size = 24 }: Props) {
  const unread = useChatUnreadBadgeStore((s) => s.totalUnread);
  const label = unread > 99 ? '99+' : String(unread);

  return (
    <View style={styles.wrap} accessibilityLabel={unread > 0 ? `${unread} unread chats` : 'Chat'}>
      <MaterialCommunityIcons name="message-text" size={size} color={color} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
});
