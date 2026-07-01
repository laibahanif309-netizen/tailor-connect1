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
import { getCurrentUser, logout } from '../../../services/auth';
import type { AuthResponse } from '../../../services/auth';
import { useToast } from '../../../utils/toast';
import { resolveMediaUrl } from '../../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../../hooks/useAppScreenTheme';
import { ProfileMenuRow } from '../../../components/profile/ProfileMenuRow';

/**
 * Customer profile — account summary, edit profile, messages, settings, help, about, logout.
 */
export default function ProfileScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildProfileStyles(t), [t]);

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
          <View style={styles.rolePill}>
            <MaterialCommunityIcons name="account" size={16} color={t.rolePillIcon} />
            <Text style={styles.roleText}>Customer</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-outline" size={20} color={t.textMuted} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Display name</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            </View>
            {user.username ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="at" size={20} color={t.textMuted} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Username</Text>
                  <Text style={styles.infoValue}>{user.username}</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color={t.textMuted} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
            {user.phone ? (
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={t.textMuted} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionHeading}>Shortcuts</Text>
        <View style={styles.card}>
          <ProfileMenuRow
            icon="account-edit-outline"
            title="Edit profile"
            subtitle="Name, username, phone, address"
            onPress={() => router.push('/(customer)/profile-edit')}
          />
          <ProfileMenuRow
            icon="message-text-outline"
            title="Messages"
            subtitle="Chats with tailors"
            onPress={() => router.push('/(customer)/(tabs)/chat')}
          />
          <ProfileMenuRow
            icon="bell-outline"
            title="Notifications"
            subtitle="Alerts and updates"
            onPress={() => router.push('/(customer)/(tabs)/notifications')}
          />
          <ProfileMenuRow
            icon="cog-outline"
            title="Settings"
            subtitle="Appearance & preferences"
            onPress={() => router.push('/(customer)/settings')}
            last
          />
        </View>

        <View style={styles.card}>
          <ProfileMenuRow
            icon="help-circle-outline"
            title="Help & support"
            subtitle="Contact & FAQs"
            onPress={() => router.push('/(customer)/help')}
          />
          <ProfileMenuRow
            icon="information-outline"
            title="About"
            subtitle="App version & info"
            onPress={() => router.push('/(customer)/about')}
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

function buildProfileStyles(t: AppScreenTheme) {
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
    card: {
      backgroundColor: t.cardBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: t.cardBorder,
      marginBottom: 16,
    },
    cardTitle: { fontSize: 17, fontWeight: '800', color: t.textPrimary, marginBottom: 14 },
    infoBlock: { gap: 0 },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.divider,
    },
    infoRowLast: { borderBottomWidth: 0 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 12, color: t.textMuted, marginBottom: 2 },
    infoValue: { fontSize: 16, fontWeight: '600', color: t.textPrimary },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '800',
      color: t.textPrimary,
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
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
