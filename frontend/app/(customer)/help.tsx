import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

const SUPPORT_EMAIL = 'support@tailorconnect.app';

export default function CustomerHelpScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildHelpStyles(t), [t]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & support</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>We are here if something does not work as expected.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <Text style={styles.body}>Email us and we will get back as soon as we can.</Text>
          <Pressable
            style={styles.linkRow}
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=TailorConnect%20help`)}
          >
            <MaterialCommunityIcons name="email-outline" size={22} color={t.gold} />
            <Text style={styles.link}>{SUPPORT_EMAIL}</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orders & visits</Text>
          <Text style={styles.body}>
            For changes to an order or a home visit, open the order or booking in the app and message your tailor
            directly from Chat.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function buildHelpStyles(t: AppScreenTheme) {
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
    scroll: { padding: 20 },
    lead: { fontSize: 16, color: t.textSecondary, lineHeight: 24, marginBottom: 20 },
    card: {
      backgroundColor: t.cardBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: t.cardBorder,
      marginBottom: 16,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: t.textPrimary, marginBottom: 8 },
    body: { fontSize: 15, color: t.textSecondary, lineHeight: 22 },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
    link: { fontSize: 15, color: t.gold, fontWeight: '600', textDecorationLine: 'underline' },
  });
}
