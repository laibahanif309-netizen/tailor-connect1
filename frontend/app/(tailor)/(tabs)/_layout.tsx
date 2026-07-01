import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Appearance } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNotificationBadgeSync } from '../../../hooks/useNotificationBadgeSync';
import { useChatUnreadBadgeSync } from '../../../hooks/useChatUnreadBadgeSync';
import { TabBarNotificationIcon } from '../../../components/notifications/TabBarNotificationIcon';
import { TabBarChatIcon } from '../../../components/chat/TabBarChatIcon';
import { applyStoredColorScheme } from '../../../services/appPreferences';

/**
 * Tailor bottom tabs — dashboard, orders, chat.
 */
export default function TailorTabsLayout() {
  useNotificationBadgeSync();
  useChatUnreadBadgeSync();
  const colorScheme = useColorScheme();
  const isDark = (colorScheme ?? Appearance.getColorScheme()) === 'dark';

  useEffect(() => {
    void applyStoredColorScheme();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C9A227',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#E5E7EB',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          height: 62,
          paddingBottom: 8,
          overflow: 'visible',
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <TabBarChatIcon color={color} size={size || 24} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <TabBarNotificationIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
