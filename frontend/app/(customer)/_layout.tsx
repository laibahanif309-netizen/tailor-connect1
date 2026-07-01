import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { CustomerAiAssistantFab } from '../../components/customer/CustomerAiAssistantFab';

/**
 * Customer Layout
 * Stack navigator for customer screens
 * Wraps the tabs navigator and handles stack screens
 */
export default function CustomerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="search" 
          options={{
            title: 'Search & Filter',
            presentation: 'card',
          }}
        />
        <Stack.Screen 
          name="tailor-profile" 
          options={{
            title: 'Tailor Profile',
            presentation: 'card',
          }}
        />
        <Stack.Screen 
          name="portfolio-gallery" 
          options={{
            title: 'Portfolio Gallery',
            presentation: 'card',
            headerShown: true,
          }}
        />
        <Stack.Screen name="place-order" options={{ presentation: 'card', title: 'Place order' }} />
        <Stack.Screen name="order-confirmation" options={{ presentation: 'card', title: 'Confirmed' }} />
        <Stack.Screen name="order-detail" options={{ presentation: 'card', title: 'Order' }} />
        <Stack.Screen name="write-review" options={{ presentation: 'card', title: 'Write a review' }} />
        <Stack.Screen name="reviews-list" options={{ presentation: 'card', title: 'Reviews' }} />
        <Stack.Screen name="book-home-visit" options={{ presentation: 'card', title: 'Book home visit' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card', title: 'Chat' }} />
        <Stack.Screen name="profile-edit" options={{ presentation: 'card', title: 'Edit profile' }} />
        <Stack.Screen name="change-password" options={{ presentation: 'card', title: 'Change password' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card', title: 'Settings' }} />
        <Stack.Screen name="help" options={{ presentation: 'card', title: 'Help' }} />
        <Stack.Screen name="about" options={{ presentation: 'card', title: 'About' }} />
      </Stack>
      <CustomerAiAssistantFab />
      <StatusBar style="auto" />
    </View>
  );
}
