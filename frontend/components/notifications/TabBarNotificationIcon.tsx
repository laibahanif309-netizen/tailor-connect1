import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNotificationBadgeStore } from '../../store/notificationBadge';

type Props = {
  color: string;
  size?: number;
};

/**
 * Bell tab icon with an unread count pill. Renders the badge in the icon tree so it
 * always updates with Zustand (Expo Router + `tabBarBadge` can fail to show reliably).
 */
export function TabBarNotificationIcon({ color, size = 24 }: Props) {
  const unread = useNotificationBadgeStore((s) => s.unreadCount);
  const label = unread > 99 ? '99+' : String(unread);

  return (
    <View style={styles.wrap} accessibilityLabel={unread > 0 ? `${unread} unread notifications` : 'Notifications'}>
      <MaterialCommunityIcons name="bell" size={size} color={color} />
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
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#C62828',
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
