import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  useColorScheme,
  Appearance,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import {
  PREF_COLOR_SCHEME,
  getStringPref,
  setStringPref,
  applyColorSchemePref,
  type ColorSchemePref,
} from '../../services/appPreferences';

function useThemedColors() {
  const scheme = useColorScheme();
  const isDark = (scheme ?? Appearance.getColorScheme()) === 'dark';
  return useMemo(
    () =>
      isDark
        ? {
            screenBg: '#0F172A',
            headerBg: '#1E293B',
            headerBorder: '#334155',
            cardBg: '#1E293B',
            cardBorder: '#334155',
            section: '#94A3B8',
            title: '#F1F5F9',
            subtitle: '#94A3B8',
            segmentIdle: '#334155',
            segmentActiveBg: '#422006',
            segmentActiveBorder: '#C9A227',
            segmentLabel: '#94A3B8',
            segmentLabelActive: '#FEF3C7',
            rowBorder: '#334155',
            chevron: '#64748B',
          }
        : {
            screenBg: '#F5F6F8',
            headerBg: '#FFFFFF',
            headerBorder: '#E5E7EB',
            cardBg: '#FFFFFF',
            cardBorder: '#E5E7EB',
            section: '#1D3A5F',
            title: '#1D3A5F',
            subtitle: '#6B7280',
            segmentIdle: '#F3F4F6',
            segmentActiveBg: '#FEF3C7',
            segmentActiveBorder: '#C9A227',
            segmentLabel: '#6B7280',
            segmentLabelActive: '#1D3A5F',
            rowBorder: '#F3F4F6',
            chevron: '#9CA3AF',
          },
    [isDark]
  );
}

export default function CustomerSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();
  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<ColorSchemePref>('system');

  const load = useCallback(async () => {
    setLoading(true);
    const s = (await getStringPref(PREF_COLOR_SCHEME)) as ColorSchemePref | null;
    setScheme(s && ['light', 'dark', 'system'].includes(s) ? s : 'system');
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSchemeChange = async (next: ColorSchemePref) => {
    setScheme(next);
    await setStringPref(PREF_COLOR_SCHEME, next);
    applyColorSchemePref(next);
  };

  const openSystemSettings = () => {
    void Linking.openSettings();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flex: { flex: 1, backgroundColor: colors.screenBg },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingBottom: 12,
          backgroundColor: colors.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
        },
        backBtn: { padding: 8 },
        headerTitle: { fontSize: 18, fontWeight: '700', color: colors.title },
        scroll: { padding: 20, paddingBottom: 40 },
        section: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.section,
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        sectionGap: { marginTop: 8 },
        card: {
          backgroundColor: colors.cardBg,
          borderRadius: 14,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          marginBottom: 8,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        rowPress: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.rowBorder,
        },
        rowPressLast: { borderBottomWidth: 0 },
        rowText: { flex: 1 },
        rowTitle: { fontSize: 16, fontWeight: '600', color: colors.title },
        rowSub: { fontSize: 13, color: colors.subtitle, marginTop: 4 },
        segment: { flexDirection: 'row', marginTop: 6, marginBottom: 10, marginHorizontal: 8, gap: 8 },
        segmentItem: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: colors.segmentIdle,
          alignItems: 'center',
        },
        segmentItemActive: {
          backgroundColor: colors.segmentActiveBg,
          borderWidth: 1,
          borderColor: colors.segmentActiveBorder,
        },
        segmentLabel: { fontSize: 14, fontWeight: '600', color: colors.segmentLabel },
        segmentLabelActive: { color: colors.segmentLabelActive },
        hint: { fontSize: 12, color: colors.subtitle, marginHorizontal: 12, marginBottom: 12, lineHeight: 18 },
      }),
    [colors]
  );

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#C9A227" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.title} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="theme-light-dark" size={22} color={colors.title} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Dark mode</Text>
              <Text style={styles.rowSub}>Auto follows your device; or lock to light or dark.</Text>
            </View>
          </View>
          <View style={styles.segment}>
            {(['system', 'light', 'dark'] as const).map((key) => (
              <Pressable
                key={key}
                onPress={() => void onSchemeChange(key)}
                style={[styles.segmentItem, scheme === key && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentLabel, scheme === key && styles.segmentLabelActive]}>
                  {key === 'system' ? 'Auto' : key === 'light' ? 'Light' : 'Dark'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.section, styles.sectionGap]}>Account</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.rowPress}
            onPress={() => router.push('/(customer)/profile-edit')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <MaterialCommunityIcons name="account-edit-outline" size={22} color={colors.title} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Edit profile</Text>
                <Text style={styles.rowSub}>Name, phone, and delivery address</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.chevron} />
          </Pressable>
          <Pressable
            style={[styles.rowPress, styles.rowPressLast]}
            onPress={() => router.push('/(customer)/change-password')}
            accessibilityRole="button"
            accessibilityLabel="Change password"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <MaterialCommunityIcons name="lock-reset" size={22} color={colors.title} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Change password</Text>
                <Text style={styles.rowSub}>Update with your current password</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.section, styles.sectionGap]}>Notifications</Text>
        <View style={styles.card}>
          <Pressable
            style={[styles.rowPress, styles.rowPressLast]}
            onPress={openSystemSettings}
            accessibilityRole="button"
            accessibilityLabel="Open system notification settings"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <MaterialCommunityIcons name="bell-cog-outline" size={22} color={colors.title} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>System notification settings</Text>
                <Text style={styles.rowSub}>Allow or block alerts for this app in iOS or Android settings</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={20} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={[styles.section, styles.sectionGap]}>Support</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.rowPress}
            onPress={() => router.push('/(customer)/help')}
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <MaterialCommunityIcons name="help-circle-outline" size={22} color={colors.title} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Help</Text>
                <Text style={styles.rowSub}>Using orders, chat, and visits</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.chevron} />
          </Pressable>
          <Pressable
            style={[styles.rowPress, styles.rowPressLast]}
            onPress={() => router.push('/(customer)/about')}
            accessibilityRole="button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <MaterialCommunityIcons name="information-outline" size={22} color={colors.title} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>About this app</Text>
                <Text style={styles.rowSub}>Version and what TailorConnect does</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.chevron} />
          </Pressable>
        </View>

        <Text style={styles.hint}>
          Appearance is saved on this device and applies across the app. Account changes sync when you are
          online.
        </Text>
      </ScrollView>
    </View>
  );
}
