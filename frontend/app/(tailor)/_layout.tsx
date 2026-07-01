import React from 'react';
import { Stack } from 'expo-router';

/**
 * Tailor area — tabs group + stack screens (order detail, chat, studio tools).
 */
export default function TailorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="profile-edit" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card', title: 'Settings' }} />
      <Stack.Screen name="help" options={{ presentation: 'card', title: 'Help' }} />
      <Stack.Screen name="about" options={{ presentation: 'card', title: 'About' }} />
      <Stack.Screen name="change-password" options={{ presentation: 'card', title: 'Change password' }} />
      <Stack.Screen name="portfolio-management" options={{ presentation: 'card' }} />
      <Stack.Screen name="fabric-management" options={{ presentation: 'card' }} />
      <Stack.Screen name="home-visit-requests" options={{ presentation: 'card', title: 'Home visits' }} />
    </Stack>
  );
}
