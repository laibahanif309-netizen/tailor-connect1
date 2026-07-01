import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

export default function CustomerAboutScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildAboutStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const name = Constants.expoConfig?.name ?? 'TailorConnect';

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <MaterialCommunityIcons name="hanger" size={48} color={t.gold} />
          <Text style={styles.appName}>{name}</Text>
          <Text style={styles.version}>Version {version}</Text>
        </View>
        <Text style={styles.body}>
          TailorConnect links customers with trusted tailors for custom orders, fittings, and home visits.
        </Text>
      </ScrollView>
    </View>
  );
}

function buildAboutStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.screenBg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: t.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: t.textPrimary },
    scroll: { padding: 24 },
    hero: { alignItems: 'center', marginBottom: 24 },
    appName: { fontSize: 22, fontWeight: '800', color: t.textPrimary, marginTop: 12 },
    version: { fontSize: 14, color: t.textSecondary, marginTop: 4 },
    body: { fontSize: 15, color: t.textSecondary, lineHeight: 24, textAlign: 'center' },
  });
}
