import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from '../../components/ui/scroll-view';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { GradientButton } from '../../components/common/GradientButton';
import { LabeledInputField } from '../../components/common/LabeledInputField';
import { fetchMeFromApi, patchMyAccount } from '../../services/auth';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../utils/toast';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

/**
 * Customer profile edit — User + CustomerProfile fields from Prisma schema.
 */
export default function CustomerProfileEditScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildCustomerProfileEditStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await fetchMeFromApi();
      setEmail(u.email);
      setFullName(u.fullName ?? '');
      setUsername(u.username ?? '');
      setPhone(u.phone ?? '');
      const cp = u.customerProfile;
      setAddress(cp?.address ?? '');
      setCity(cp?.city ?? '');
      setState(cp?.state ?? '');
      setPostalCode(cp?.postalCode ?? '');
      setNotes(cp?.notes ?? '');
    } catch (e) {
      showError('Profile', getErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!username.trim() || username.trim().length < 3) {
      showError('Validation', 'Username must be at least 3 characters.');
      return;
    }
    setSaving(true);
    try {
      await patchMyAccount({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        notes: notes.trim(),
      });
      showSuccess('Saved', 'Your profile was updated.');
      router.back();
    } catch (e) {
      showError('Profile', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={t.gold} />
        <Text style={styles.muted}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Account</Text>
        <LabeledInputField
          label="Display name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          icon={<MaterialCommunityIcons name="account-outline" size={22} color={t.gold} />}
        />
        <LabeledInputField
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="Unique username"
          icon={<MaterialCommunityIcons name="at" size={22} color={t.gold} />}
          autoCapitalize="none"
        />
        <View style={styles.fieldBlock}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.readonlyRow}>
            <MaterialCommunityIcons name="email-lock-outline" size={20} color={t.textMuted} />
            <Text style={styles.readonlyEmail}>{email}</Text>
          </View>
          <Text style={styles.hint}>Email cannot be changed here. Contact support if needed.</Text>
        </View>
        <LabeledInputField
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          icon={<MaterialCommunityIcons name="phone-outline" size={22} color={t.gold} />}
          keyboardType="phone-pad"
        />

        <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Delivery address (optional)</Text>
        <Text style={styles.sectionHint}>Used for orders and home visits.</Text>
        <LabeledInputField
          label="Street address"
          value={address}
          onChangeText={setAddress}
          placeholder="Address line"
          icon={<MaterialCommunityIcons name="map-marker-outline" size={22} color={t.gold} />}
        />
        <LabeledInputField
          label="City"
          value={city}
          onChangeText={setCity}
          placeholder="City"
          icon={<MaterialCommunityIcons name="city-variant-outline" size={22} color={t.gold} />}
        />
        <LabeledInputField
          label="State / region"
          value={state}
          onChangeText={setState}
          placeholder="State"
          icon={<MaterialCommunityIcons name="map-outline" size={22} color={t.gold} />}
        />
        <LabeledInputField
          label="Postal code"
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder="Postal / ZIP"
          icon={<MaterialCommunityIcons name="mailbox-outline" size={22} color={t.gold} />}
        />

        <Text style={[styles.sectionLabel, styles.sectionSpaced]}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything your tailors should know…"
          placeholderTextColor={t.textMuted}
          multiline
          style={styles.notes}
        />

        <GradientButton title={saving ? 'Saving…' : 'Save changes'} onPress={() => void save()} disabled={saving} />
      </ScrollView>
    </View>
  );
}

function buildCustomerProfileEditStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.screenBg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.screenBg },
    muted: { marginTop: 8, fontSize: 14, color: t.textSecondary },
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
    scroll: { padding: 20, paddingBottom: 40 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: t.textPrimary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionSpaced: { marginTop: 20 },
    sectionHint: { fontSize: 13, color: t.textSecondary, marginBottom: 12, marginTop: -4 },
    fieldBlock: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: t.textPrimary, marginBottom: 8 },
    readonlyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: t.menuIconBg,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    readonlyEmail: { flex: 1, fontSize: 15, color: t.cardBody },
    hint: { fontSize: 12, color: t.textMuted, marginTop: 6 },
    notes: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: t.cardBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: t.inputText,
      backgroundColor: t.cardBg,
      textAlignVertical: 'top',
      marginBottom: 24,
    },
  });
}
