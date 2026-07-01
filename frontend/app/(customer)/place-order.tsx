import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from '../../components/ui/scroll-view';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { Text } from '../../components/ui/text';
import { Heading } from '../../components/ui/heading';
import { Card } from '../../components/ui/card';
import { VStack } from '../../components/ui/vstack';
import { GradientButton } from '../../components/common/GradientButton';
import { getTailorById } from '../../services/tailors';
import type { FabricItem, TailorProfile } from '../../types/tailor';
import type { StitchingTypeApi } from '../../types/order';
import { createOrder } from '../../services/orders';
import { getCurrentUser } from '../../services/auth';
import { useToast } from '../../utils/toast';
import { getErrorMessage } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

const STITCH_OPTIONS: { key: StitchingTypeApi; label: string }[] = [
  { key: 'mens', label: "Men's" },
  { key: 'womens', label: "Women's" },
  { key: 'childrens', label: "Children's" },
];

/**
 * Place order — POST /api/orders (customer)
 */
export default function PlaceOrderScreen() {
  const theme = useAppScreenTheme();
  const styles = useMemo(() => buildPlaceOrderStyles(theme), [theme]);
  const params = useLocalSearchParams<{ tailorId?: string; fabricId?: string }>();
  const tailorId = normalizeParam(params.tailorId);
  const initialFabricId = normalizeParam(params.fabricId);

  const { showError, showSuccess } = useToast();
  const [tailor, setTailor] = useState<TailorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedFabricId, setSelectedFabricId] = useState<string | null>(initialFabricId ?? null);
  const [stitchingType, setStitchingType] = useState<StitchingTypeApi>('mens');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isExpress, setIsExpress] = useState(false);
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [length, setLength] = useState('');
  const [shoulder, setShoulder] = useState('');

  const load = useCallback(async () => {
    if (!tailorId) {
      showError('Missing tailor', 'Cannot place an order without a tailor.');
      router.back();
      return;
    }
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      showError('Sign in required', 'Please log in as a customer to place an order.');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const profile = await getTailorById(tailorId);
      if (!profile) {
        showError('Not found', 'Tailor could not be loaded.');
        router.back();
        return;
      }
      setTailor(profile);
      if (initialFabricId && profile.fabrics.some((f) => f.id === initialFabricId)) {
        setSelectedFabricId(initialFabricId);
      } else if (profile.fabrics.length === 1) {
        setSelectedFabricId(profile.fabrics[0].id);
      }
    } catch (e: unknown) {
      showError('Error', getErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [tailorId, initialFabricId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const toIsoDelivery = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.includes('T')) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T12:00:00.000Z`;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleSubmit = async () => {
    if (!tailorId || !tailor) return;
    if (!selectedFabricId) {
      showError('Fabric', 'Please select a fabric.');
      return;
    }
    if (!deliveryAddress.trim()) {
      showError('Address', 'Delivery address is required.');
      return;
    }
    const iso = toIsoDelivery(deliveryDate);
    if (!iso) {
      showError('Date', 'Enter a valid delivery date (YYYY-MM-DD).');
      return;
    }
    const measurements: Record<string, string> = {};
    if (chest.trim()) measurements.chest = chest.trim();
    if (waist.trim()) measurements.waist = waist.trim();
    if (length.trim()) measurements.length = length.trim();
    if (shoulder.trim()) measurements.shoulder = shoulder.trim();
    if (Object.keys(measurements).length === 0) {
      showError('Measurements', 'Add at least one measurement.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrder({
        tailorId,
        fabricId: selectedFabricId,
        stitchingType,
        deliveryAddress: deliveryAddress.trim(),
        deliveryDate: iso,
        specialInstructions: specialInstructions.trim() || undefined,
        isExpress,
        measurements,
      });
      showSuccess('Order placed', 'Your order was submitted successfully.');
      const tailorName = encodeURIComponent(tailor?.businessName ?? 'Tailor');
      router.replace(
        `/(customer)/order-confirmation?orderId=${encodeURIComponent(created.id)}&orderNumber=${encodeURIComponent(created.orderNumber)}&tailorName=${tailorName}`
      );
    } catch (e: unknown) {
      showError('Could not place order', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  function Field({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
  }) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    );
  }

  if (loading || !tailor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.gold} />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            Place order
          </Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tailorHint}>{tailor.businessName}</Text>

          <Card style={styles.card}>
            <Heading size="sm" style={styles.cardTitle}>
              Fabric
            </Heading>
            {tailor.fabrics.length === 0 ? (
              <Text style={styles.muted}>This tailor has no fabrics listed yet.</Text>
            ) : (
              <VStack space="sm">
                {tailor.fabrics.map((f: FabricItem) => {
                  const selected = f.id === selectedFabricId;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => setSelectedFabricId(f.id)}
                      style={[styles.fabricRow, selected && styles.fabricRowSelected]}
                    >
                      <VStack style={{ flex: 1 }}>
                        <Text style={styles.fabricName}>{f.name}</Text>
                        <Text style={styles.fabricPrice}>PKR {f.price.toLocaleString('en-PK')}</Text>
                      </VStack>
                      <MaterialCommunityIcons
                        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={22}
                        color={selected ? theme.gold : theme.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </VStack>
            )}
          </Card>

          <Card style={styles.card}>
            <Heading size="sm" style={styles.cardTitle}>
              Stitching
            </Heading>
            <View style={styles.chipRow}>
              {STITCH_OPTIONS.map((opt) => {
                const on = stitchingType === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setStitchingType(opt.key)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={styles.card}>
            <Heading size="sm" style={styles.cardTitle}>
              Measurements (cm)
            </Heading>
            <View style={styles.grid2}>
              <Field label="Chest" value={chest} onChangeText={setChest} />
              <Field label="Waist" value={waist} onChangeText={setWaist} />
              <Field label="Length" value={length} onChangeText={setLength} />
              <Field label="Shoulder" value={shoulder} onChangeText={setShoulder} />
            </View>
          </Card>

          <Card style={styles.card}>
            <Heading size="sm" style={styles.cardTitle}>
              Delivery
            </Heading>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Street, area, city"
              placeholderTextColor={theme.textMuted}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
            />
            <Text style={[styles.label, { marginTop: 12 }]}>Delivery date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              autoCapitalize="none"
            />
            <View style={styles.expressRow}>
              <Text style={styles.expressLabel}>Express stitching</Text>
              <Switch value={isExpress} onValueChange={setIsExpress} trackColor={{ true: theme.gold }} />
            </View>
            <Text style={[styles.label, { marginTop: 12 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Special instructions"
              placeholderTextColor={theme.textMuted}
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
            />
          </Card>

          <GradientButton
            title="Submit order"
            onPress={() => void handleSubmit()}
            height={48}
            borderRadius={24}
            isLoading={submitting}
            loadingText="Submitting…"
          />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function buildPlaceOrderStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    muted: { fontSize: 14, color: t.textSecondary },
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
    topTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    scroll: { padding: 16, paddingBottom: 40 },
    tailorHint: {
      fontSize: 14,
      color: t.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
    },
    card: {
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: t.cardBg,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    cardTitle: { marginBottom: 12, color: t.textPrimary },
    fabricRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    fabricRowSelected: {
      borderColor: t.gold,
      backgroundColor: t.isDark ? 'rgba(201, 162, 39, 0.12)' : t.cardUnreadBg,
    },
    fabricName: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
    fabricPrice: { fontSize: 14, color: t.gold, marginTop: 2 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: t.divider,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    chipOn: {
      backgroundColor: t.gold,
      borderColor: t.gold,
    },
    chipText: { fontSize: 14, fontWeight: '600', color: t.textSecondary },
    chipTextOn: { color: '#FFFFFF' },
    grid2: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    field: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: t.textPrimary, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: t.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: t.inputText,
      backgroundColor: t.searchBg,
    },
    multiline: { minHeight: 88, textAlignVertical: 'top' },
    expressRow: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    expressLabel: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
  });
}
