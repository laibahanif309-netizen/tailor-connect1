import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { ScrollView } from '../../components/ui/scroll-view';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { GradientButton } from '../../components/common/GradientButton';
import { LabeledInputField } from '../../components/common/LabeledInputField';
import { MultiSelectChips } from '../../components/common/MultiSelectChips';
import {
  fetchMyTailorProfile,
  updateMyTailorProfile,
  uploadMyProfileImage,
} from '../../services/tailorStudio';
import { resolveMediaUrl, getErrorMessage } from '../../services/api';
import { useToast } from '../../utils/toast';
import type { TailorProfile } from '../../types/tailor';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

const SPEC_OPTIONS = [
  "Men's Wear",
  "Women's Wear",
  "Children's Wear",
  'Formal',
  'Casual',
  'Traditional',
];

export default function TailorProfileEditScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorProfileEditStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tailor, setTailor] = useState<TailorProfile | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchMyTailorProfile();
      setTailor(profile);
      setBusinessName(profile.businessName);
      setLocation(profile.location);
      setPhone(profile.phone ?? '');
      setDescription(profile.description ?? '');
      setExperience(String(profile.experience ?? 0));
      const validSpecs = (profile.specializations ?? []).filter((s) => SPEC_OPTIONS.includes(s));
      setSpecializations(validSpecs.length ? validSpecs : [SPEC_OPTIONS[0]]);
      setIsAvailable(profile.isAvailable);
      setProfileImageUrl(profile.profileImage);
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

  const pickProfilePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError('Photos', 'Permission is required to choose a photo.');
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    try {
      const url = await uploadMyProfileImage(asset.uri, asset.mimeType ?? 'image/jpeg');
      setProfileImageUrl(url);
      showSuccess('Photo updated', 'Your profile photo was saved.');
    } catch (e) {
      showError('Upload', getErrorMessage(e));
    }
  };

  const save = async () => {
    const exp = parseInt(experience, 10);
    if (!businessName.trim() || businessName.trim().length < 2) {
      showError('Validation', 'Business name must be at least 2 characters.');
      return;
    }
    if (!location.trim()) {
      showError('Validation', 'Location is required.');
      return;
    }
    if (specializations.length < 1) {
      showError('Validation', 'Select at least one specialization.');
      return;
    }
    if (!Number.isFinite(exp) || exp < 0 || exp > 80) {
      showError('Validation', 'Experience must be a number from 0 to 80.');
      return;
    }
    if (description.length > 500) {
      showError('Validation', 'Description must be 500 characters or less.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyTailorProfile({
        businessName: businessName.trim(),
        location: location.trim(),
        description: description.trim() || null,
        yearsOfExperience: exp,
        specializations,
        isAvailable,
        phone: phone.trim() || null,
      });
      setTailor(updated);
      setProfileImageUrl(updated.profileImage);
      showSuccess('Saved', 'Your profile was updated.');
    } catch (e) {
      showError('Save failed', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tailor) {
    return (
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Edit profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
        </View>
      </View>
    );
  }

  const avatarUri = profileImageUrl ? resolveMediaUrl(profileImageUrl) : '';

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.section}>Business photo</Text>
          <Pressable onPress={pickProfilePhoto} style={styles.avatarRow}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPh]}>
                <MaterialCommunityIcons name="camera" size={32} color={t.textMuted} />
              </View>
            )}
            <Text style={styles.changePhoto}>Tap to change photo</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Account</Text>
          <Text style={styles.muted}>Email (read-only)</Text>
          <Text style={styles.email}>{tailor.email}</Text>
        </Card>

        <Card style={styles.card}>
          <LabeledInputField
            label="Business name"
            placeholder="Your shop name"
            value={businessName}
            onChangeText={setBusinessName}
          />
          <View style={{ height: 12 }} />
          <LabeledInputField
            label="Location"
            placeholder="City or area"
            value={location}
            onChangeText={setLocation}
          />
          <View style={{ height: 12 }} />
          <LabeledInputField
            label="Phone"
            placeholder="Contact number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View style={{ height: 12 }} />
          <LabeledInputField
            label="Years of experience"
            placeholder="0"
            value={experience}
            onChangeText={setExperience}
            keyboardType="number-pad"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>About</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Tell customers about your services…"
            placeholderTextColor={t.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.counter}>{description.length}/500</Text>
        </Card>

        <Card style={styles.card}>
          <MultiSelectChips
            label="Specializations"
            options={SPEC_OPTIONS}
            selected={specializations}
            onSelectionChange={setSpecializations}
            minSelections={1}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.section}>Available for new orders</Text>
              <Text style={styles.muted}>Turn off to hide from availability filters</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: t.textMuted, true: t.gold }}
              thumbColor={t.cardBg}
            />
          </View>
        </Card>

        <GradientButton
          title={saving ? 'Saving…' : 'Save changes'}
          onPress={() => void save()}
          disabled={saving}
          height={48}
          borderRadius={24}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function buildTailorProfileEditStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 10,
      backgroundColor: t.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.headerBorder,
    },
    back: { padding: 8 },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: t.textPrimary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 16, paddingBottom: 40 },
    card: {
      padding: 16,
      marginBottom: 14,
      borderRadius: 12,
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    section: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 10 },
    muted: { fontSize: 13, color: t.textMuted, marginBottom: 4 },
    email: { fontSize: 15, color: t.textPrimary, fontWeight: '600' },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: t.cardBorder,
    },
    avatarPh: { alignItems: 'center', justifyContent: 'center' },
    changePhoto: { fontSize: 14, fontWeight: '600', color: t.textPrimary, flex: 1 },
    textarea: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: t.cardBorder,
      borderRadius: 12,
      padding: 12,
      fontSize: 15,
      color: t.inputText,
      backgroundColor: t.searchBg,
    },
    counter: { alignSelf: 'flex-end', fontSize: 12, color: t.textMuted, marginTop: 6 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });
}
