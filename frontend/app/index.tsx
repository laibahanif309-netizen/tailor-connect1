import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Text,
  useColorScheme,
  Appearance,
} from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { getAuthToken, getUserData } from '../services/auth';

const BRAND_GOLD = '#C9A227';
const BG_LIGHT = '#F5F6F8';
const BG_DARK = '#0F172A';

export default function Index() {
  const scheme = useColorScheme();
  const isDark = (scheme ?? Appearance.getColorScheme()) === 'dark';
  const styles = useMemo(() => buildStyles(isDark), [isDark]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useLayoutEffect(() => {
    void ExpoSplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let navigationTimeout: ReturnType<typeof setTimeout>;

    const checkAuthAndNavigate = async () => {
      try {
        navigationTimeout = setTimeout(() => {
          if (isMounted) {
            router.replace('/login');
          }
        }, 5000);

        const token = await getAuthToken();
        const userData = await getUserData();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!isMounted) return;

        clearTimeout(navigationTimeout);

        if (token && userData) {
          if (userData.role === 'tailor') {
            router.replace('/(tailor)/(tabs)/dashboard');
          } else {
            router.replace('/(customer)/(tabs)/home');
          }
        } else {
          router.replace('/login');
        }
      } catch {
        if (isMounted) {
          clearTimeout(navigationTimeout);
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    void checkAuthAndNavigate();

    return () => {
      isMounted = false;
      clearTimeout(navigationTimeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoBlock}>
        <Image
          source={require('../assets/TailorConnect_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>TailorConnect</Text>
        <Text style={styles.tagline}>Custom tailoring, simplified</Text>
      </View>
      {isCheckingAuth ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="large" color={BRAND_GOLD} />
          <Text style={styles.loadingLabel}>Loading…</Text>
        </View>
      ) : null}
    </View>
  );
}

function buildStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? BG_DARK : BG_LIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    logoBlock: {
      alignItems: 'center',
      maxWidth: 280,
    },
    logo: {
      width: 200,
      height: 120,
      marginBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#1D3A5F',
      letterSpacing: 0.5,
    },
    tagline: {
      marginTop: 8,
      fontSize: 15,
      color: isDark ? '#94A3B8' : '#6B7280',
      textAlign: 'center',
    },
    loadingRow: {
      marginTop: 40,
      alignItems: 'center',
      gap: 12,
    },
    loadingLabel: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : '#6B7280',
    },
  });
}
