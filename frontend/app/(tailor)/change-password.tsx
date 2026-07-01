import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ScrollView } from '../../components/ui/scroll-view';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { GradientButton } from '../../components/common/GradientButton';
import { LabeledInputField } from '../../components/common/LabeledInputField';
import { changePasswordWithCurrent } from '../../services/auth';
import { getErrorMessage } from '../../services/api';
import { useToast } from '../../utils/toast';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

export default function TailorChangePasswordScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildChangePasswordStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async () => {
    if (!current) {
      showError('Validation', 'Enter your current password.');
      return;
    }
    if (next.length < 6) {
      showError('Validation', 'New password must be at least 6 characters.');
      return;
    }
    if (next !== confirm) {
      showError('Validation', 'New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePasswordWithCurrent(current, next);
      showSuccess('Password updated', 'Use your new password next time you sign in.');
      router.back();
    } catch (e) {
      showError('Password', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Change password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Enter your current password, then choose a new one. Your session stays signed in.
        </Text>

        <LabeledInputField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          placeholder="Current password"
          secureTextEntry={!showCurrent}
          autoCapitalize="none"
          icon={<MaterialCommunityIcons name={showCurrent ? 'eye-off' : 'eye'} size={22} color={t.gold} />}
          onIconPress={() => setShowCurrent((v) => !v)}
        />
        <LabeledInputField
          label="New password"
          value={next}
          onChangeText={setNext}
          placeholder="At least 6 characters"
          secureTextEntry={!showNext}
          autoCapitalize="none"
          icon={<MaterialCommunityIcons name={showNext ? 'eye-off' : 'eye'} size={22} color={t.gold} />}
          onIconPress={() => setShowNext((v) => !v)}
        />
        <LabeledInputField
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Re-enter new password"
          secureTextEntry={!showConfirm}
          autoCapitalize="none"
          icon={<MaterialCommunityIcons name={showConfirm ? 'eye-off' : 'eye'} size={22} color={t.gold} />}
          onIconPress={() => setShowConfirm((v) => !v)}
        />

        <GradientButton
          title={saving ? 'Updating…' : 'Update password'}
          onPress={() => void submit()}
          disabled={saving}
        />
      </ScrollView>
    </View>
  );
}

function buildChangePasswordStyles(t: AppScreenTheme) {
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
    scroll: { padding: 20, paddingBottom: 40 },
    intro: { fontSize: 14, color: t.textSecondary, lineHeight: 20, marginBottom: 20 },
  });
}
