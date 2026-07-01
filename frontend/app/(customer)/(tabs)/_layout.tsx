import { Tabs } from 'expo-router';
import { Platform, useColorScheme, Appearance } from 'react-native';
import { useEffect } from 'react';
import { useNotificationBadgeSync } from '../../../hooks/useNotificationBadgeSync';
import { useChatUnreadBadgeSync } from '../../../hooks/useChatUnreadBadgeSync';
import { TabBarNotificationIcon } from '../../../components/notifications/TabBarNotificationIcon';
import { TabBarChatIcon } from '../../../components/chat/TabBarChatIcon';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { applyStoredColorScheme } from '../../../services/appPreferences';

/**
 * Customer Tabs Layout
 * Bottom tab navigation for customer role
 * 5 tabs: Home, Orders, Chat, Notifications, Profile
 */
export default function CustomerTabsLayout() {
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
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#E5E7EB',
          height: Platform.OS === 'ios' ? 70 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 0,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" size={size || 24} color={color} />
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
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <TabBarNotificationIcon color={color} size={size || 24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
