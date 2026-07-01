import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../../components/ui/text';
import { QuickActionCard } from '../../../components/common/QuickActionCard';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';
import { getCurrentUser, logout } from '../../../services/auth';
import type { AuthResponse } from '../../../services/auth';
import { useToast } from '../../../utils/toast';
import { resolveMediaUrl } from '../../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../../hooks/useAppScreenTheme';

/**
 * Tailor profile — quick studio actions, shortcuts (home visits, settings), support, logout.
 * Menu rows match customer profile (icon tile, title, subtitle, chevron).
 */
export default function ProfileScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorProfileStyles(t), [t]);

  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useFocusEffect(
    useCallback(() => {
      void loadUserData();
    }, [loadUserData])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            showSuccess('Logged out', 'You have been successfully logged out');
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Error logging out:', error);
            showError('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.muted}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingWrap}>
          <Text style={styles.muted}>No user data found</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.textBtn}>
            <Text style={styles.textBtnLabel}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarUri = user.profileImageUrl ? resolveMediaUrl(user.profileImageUrl) : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          <View style={styles.rolePill}>
            <MaterialCommunityIcons name="account-tie" size={16} color={t.rolePillIcon} />
            <Text style={styles.roleText}>Tailor</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Quick actions</Text>
        <View style={styles.quickGrid}>
          <View style={styles.quickRow}>
            <QuickActionCard
              icon="account-edit"
              label="Edit Profile"
              onPress={() => router.push('/(tailor)/profile-edit')}
            />
            <QuickActionCard
              icon="image-multiple"
              label="Manage Portfolio"
              onPress={() => router.push('/(tailor)/portfolio-management')}
            />
          </View>
          <View style={styles.quickRow}>
            <QuickActionCard
              icon="texture"
              label="Manage Fabrics"
              onPress={() => router.push('/(tailor)/fabric-management')}
            />
            <QuickActionCard
              icon="clipboard-text"
              label="View Orders"
              onPress={() => router.push('/(tailor)/(tabs)/orders')}
            />
          </View>
        </View>

        <Text style={styles.sectionHeading}>Shortcuts</Text>
        <View style={styles.card}>
          <ProfileMenuRow
            icon="calendar-clock"
            title="Home visit requests"
            subtitle="Incoming booking requests"
            onPress={() => router.push('/(tailor)/home-visit-requests')}
          />
          <ProfileMenuRow
            icon="cog-outline"
            title="Settings"
            subtitle="Appearance & preferences"
            onPress={() => router.push('/(tailor)/settings')}
            last
          />
        </View>

        <Text style={[styles.sectionHeading, styles.sectionSpaced]}>Support</Text>
        <View style={styles.card}>
          <ProfileMenuRow
            icon="help-circle-outline"
            title="Help & support"
            subtitle="Contact & FAQs"
            onPress={() => router.push('/(tailor)/help')}
          />
          <ProfileMenuRow
            icon="information-outline"
            title="About"
            subtitle="App version & info"
            onPress={() => router.push('/(tailor)/about')}
            last
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildTailorProfileStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: t.screenBg },
    scroll: { padding: 16, paddingBottom: 32 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    muted: { marginTop: 8, fontSize: 15, color: t.textSecondary },
    textBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 20 },
    textBtnLabel: { color: t.gold, fontWeight: '700', fontSize: 16 },
    header: { alignItems: 'center', paddingVertical: 20 },
    avatarRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.avatarFill,
      borderWidth: 3,
      borderColor: t.gold,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    avatarImg: { width: 88, height: 88, borderRadius: 44 },
    avatarInitials: { fontSize: 28, fontWeight: '800', color: t.avatarInitials },
    name: { fontSize: 24, fontWeight: '800', color: t.textPrimary },
    email: { fontSize: 14, color: t.textSecondary, marginTop: 4 },
    phone: { fontSize: 13, color: t.textMuted, marginTop: 4 },
    rolePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: t.rolePillBg,
      borderRadius: 20,
    },
    roleText: { fontSize: 13, fontWeight: '700', color: t.rolePillText },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '800',
      color: t.textPrimary,
      marginBottom: 10,
      marginLeft: 4,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    sectionSpaced: { marginTop: 8 },
    quickGrid: { gap: 12, marginBottom: 8 },
    quickRow: { flexDirection: 'row', gap: 12 },
    card: {
      backgroundColor: t.cardBg,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: t.cardBorder,
      marginBottom: 16,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.logoutBorder,
      backgroundColor: t.logoutBtnBg,
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  });
}
