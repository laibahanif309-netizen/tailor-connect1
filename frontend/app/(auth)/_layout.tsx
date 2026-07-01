import { Stack } from 'expo-router';

/**
 * Auth Stack Layout
 * Handles navigation for authentication screens (login, register)
 * Route group (auth) doesn't affect URLs - /login and /register remain the same
 * 
 * Note: StatusBar is handled by root _layout.tsx to avoid conflicts
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          title: 'Register',
        }}
      />
    </Stack>
  );
}

