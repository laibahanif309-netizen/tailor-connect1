import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from '../../components/ui/scroll-view';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { LabeledInputField, GradientButton } from '../../components/common';
import { getTailorById } from '../../services/tailors';
import { bookHomeVisit } from '../../services/homeVisits';
import type { TailorProfile } from '../../types/tailor';
import { useToast } from '../../utils/toast';
import { getErrorMessage } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function toRequestedIso(dateYmd: string): string | null {
  const trimmed = dateYmd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function BookHomeVisitScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildBookHomeVisitStyles(t), [t]);
  const params = useLocalSearchParams<{ tailorId?: string; tailorName?: string }>();
  const tailorId = normalizeParam(params.tailorId);
  const tailorNameParam = normalizeParam(params.tailorName);
  const { showError, showSuccess } = useToast();
  const [tailor, setTailor] = useState<TailorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateYmd, setDateYmd] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');

  const load = useCallback(async () => {
    if (!tailorId) {
      showError('Booking', 'Missing tailor.');
      router.back();
      return;
    }
    setLoading(true);
    try {
      const profile = await getTailorById(tailorId);
      setTailor(profile);
    } catch (e: unknown) {
      showError('Booking', getErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [tailorId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    if (!tailorId) return;
    const iso = toRequestedIso(dateYmd);
    if (!iso) {
      showError('Date', 'Use format YYYY-MM-DD (e.g. 2026-06-15).');
      return;
    }
    if (!timeSlot.trim()) {
      showError('Time', 'Please describe your preferred time (e.g. Morning 9–12).');
      return;
    }
    if (address.trim().length < 5) {
      showError('Address', 'Please enter a full address (at least 5 characters).');
      return;
    }
    if (phone.trim().length < 5) {
      showError('Phone', 'Please enter a contact phone number.');
      return;
    }
    setSubmitting(true);
    try {
      await bookHomeVisit({
        tailorId,
        requestedDate: iso,
        timeSlot: timeSlot.trim(),
        address: address.trim(),
        phone: phone.trim(),
        purpose: purpose.trim() || undefined
      });
      showSuccess('Request sent', 'The tailor will review your home visit request.');
      router.back();
    } catch (e: unknown) {
      showError('Booking', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !tailor) {
    return (
      <View style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Home visit</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </View>
    );
  }

  const displayName = tailorNameParam || tailor.businessName;

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Book home visit</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.label}>Tailor</Text>
          <Text style={styles.bold}>{displayName}</Text>
          <Text style={styles.muted}>{tailor.location}</Text>
        </Card>

        <Card style={styles.card}>
          <LabeledInputField
            label="Preferred date (YYYY-MM-DD)"
            placeholder="2026-06-20"
            value={dateYmd}
            onChangeText={setDateYmd}
            keyboardType="numbers-and-punctuation"
          />
          <View style={{ height: 14 }} />
          <LabeledInputField
            label="Preferred time / slot"
            placeholder="e.g. Morning 9am–12pm"
            value={timeSlot}
            onChangeText={setTimeSlot}
          />
          <View style={{ height: 14 }} />
          <LabeledInputField
            label="Visit address"
            placeholder="Street, area, city"
            value={address}
            onChangeText={setAddress}
          />
          <View style={{ height: 14 }} />
          <LabeledInputField
            label="Contact phone"
            placeholder="Your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="What would you like the tailor to bring or measure?"
            placeholderTextColor={t.textMuted}
            value={purpose}
            onChangeText={setPurpose}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </Card>

        <GradientButton
          title="Submit request"
          onPress={() => void handleSubmit()}
          height={48}
          borderRadius={24}
          isLoading={submitting}
          loadingText="Sending…"
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function buildBookHomeVisitStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    muted: { marginTop: 10, fontSize: 14, color: t.textSecondary },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
    },
    back: { padding: 6 },
    topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: t.textPrimary },
    scroll: { padding: 16 },
    card: {
      padding: 16,
      marginBottom: 14,
      borderRadius: 12,
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    label: { fontSize: 13, fontWeight: '600', color: t.textSecondary, marginBottom: 6 },
    bold: { fontSize: 17, fontWeight: '700', color: t.textPrimary },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: t.textSecondary, marginBottom: 8 },
    textarea: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: t.cardBorder,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: t.inputText,
      backgroundColor: t.searchBg,
    },
  });
}
