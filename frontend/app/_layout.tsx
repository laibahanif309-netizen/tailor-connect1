import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaView } from '../components/ui/safe-area-view';
import { GluestackUIProvider } from '../components/ui/gluestack-ui-provider';
import { applyStoredColorScheme } from '../services/appPreferences';

void SplashScreen.preventAutoHideAsync().catch(() => {
  /* dev reload / already hidden */
});

/**
 * Root Layout
 * Main app layout that handles:
 * - Gluestack UI provider setup
 * - Initial routing (splash/index screen)
 * - Auth screens are handled by (auth)/_layout.tsx automatically
 * - Role-based screens will be handled by (customer)/(tailor)/(admin)/_layout.tsx
 */
export default function RootLayout() {
  useEffect(() => {
    void applyStoredColorScheme();
  }, []);

  return (
    <SafeAreaProvider>
      <KeyboardProvider preserveEdgeToEdge>
        <GluestackUIProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            >
              {/* Let Expo Router auto-discover all routes including index */}
              {/* Explicitly declaring only index can prevent route group discovery */}
            </Stack>
            <StatusBar style="auto" />
          </SafeAreaView>
        </GluestackUIProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}


