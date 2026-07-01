import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import { Card } from '../../components/ui/card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StarRating } from '../../components/common/StarRating';
import { fetchOrderById, centsToMajor } from '../../services/orders';
import { ensureConversationFromOrder } from '../../services/chat';
import type { OrderDetailApi } from '../../types/order';
import { useToast } from '../../utils/toast';
import { getErrorMessage, resolveMediaUrl } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function formatDate(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

function formatCurrencyFromCents(cents: number): string {
  return `PKR ${centsToMajor(cents).toLocaleString('en-PK')}`;
}

function measurementsRecord(m: OrderDetailApi['measurements']): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = m?.measurementsJson;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) {
      out[k] = v == null ? '' : String(v);
    }
  }
  return out;
}

/**
 * Customer order detail — GET /api/orders/:id (read-only)
 */
export default function CustomerOrderDetailScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildCustomerOrderDetailStyles(t), [t]);
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { showError } = useToast();
  const [order, setOrder] = useState<OrderDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);
  const openingChatRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) {
      showError('Order', 'Missing order id.');
      router.back();
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (e: unknown) {
      showError('Order', getErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
      <View style={styles.row}>
        <Text style={styles.muted}>{label}</Text>
        <Text style={[styles.value, bold && styles.bold]}>{value}</Text>
      </View>
    );
  }

  const handleMessageTailor = useCallback(async () => {
    if (!order || openingChatRef.current) return;
    openingChatRef.current = true;
    setOpeningChat(true);
    try {
      const conversationId = await ensureConversationFromOrder(order.id);
      const title = order.tailor.businessName || 'Tailor';
      router.push(`/(customer)/chat/${conversationId}?title=${encodeURIComponent(title)}`);
    } catch (e: unknown) {
      showError('Message', getErrorMessage(e));
    } finally {
      openingChatRef.current = false;
      setOpeningChat(false);
    }
  }, [order, showError]);

  if (loading || !order) {
    return (
      <View style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Order</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </View>
    );
  }

  const measurements = measurementsRecord(order.measurements);
  const tailorPhone = order.tailor.user?.phone ?? '';
  const tailorEmail = order.tailor.user?.email ?? '';

  const handleCall = () => {
    const raw = tailorPhone.trim();
    if (!raw) {
      showError('Info', 'No phone number on file for this tailor.');
      return;
    }
    const tel = raw.replace(/[\s\-().]/g, '');
    if (!/\d/.test(tel)) {
      showError('Call', 'Invalid phone number on file.');
      return;
    }
    void Linking.openURL(`tel:${tel}`).catch(() => showError('Error', 'Could not open dialer.'));
  };

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {order.orderNumber}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <StatusBadge status={order.status} size="md" />
          <VStack space="sm" style={{ marginTop: 12 }}>
            {(order.statusHistory ?? []).map((h, i) => (
              <View key={h.id || `${h.createdAt}-${i}`} style={styles.historyRow}>
                <Text style={styles.historyStatus}>{h.status.replace('_', ' ')}</Text>
                <Text style={styles.historyDate}>{formatDate(h.createdAt)}</Text>
              </View>
            ))}
          </VStack>
        </Card>

        {order.status === 'completed' && !order.review ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Your feedback</Text>
            <Text style={styles.muted}>How was your experience with this order?</Text>
            <Pressable
              onPress={() =>
                router.push(`/(customer)/write-review?orderId=${encodeURIComponent(order.id)}`)
              }
              style={styles.reviewCta}
            >
              <MaterialCommunityIcons name="star-outline" size={22} color={t.gold} />
              <Text style={styles.reviewCtaText}>Write a review</Text>
            </Pressable>
          </Card>
        ) : null}

        {order.review ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Your review</Text>
            <StarRating rating={order.review.rating} size={22} />
            <Text style={[styles.body, { marginTop: 10 }]}>{order.review.comment}</Text>
            <Text style={[styles.muted, { marginTop: 8 }]}>
              Posted {formatDate(order.review.createdAt)}
            </Text>
          </Card>
        ) : null}

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Tailor</Text>
          <Text style={styles.bold}>{order.tailor.businessName}</Text>
          <Text style={styles.muted}>{order.tailor.location}</Text>
          {tailorEmail ? <Text style={styles.rowText}>{tailorEmail}</Text> : null}
          {tailorPhone ? <Text style={styles.rowText}>{tailorPhone}</Text> : null}
          <View style={styles.tailorActions}>
            <Pressable onPress={handleCall} style={styles.callBtn}>
              <MaterialCommunityIcons name="phone" size={18} color={t.textPrimary} />
              <Text style={styles.callBtnText}>Call tailor</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleMessageTailor()}
              disabled={openingChat}
              style={[styles.callBtn, openingChat && styles.callBtnDisabled]}
            >
              <MaterialCommunityIcons name="message-text-outline" size={18} color={t.textPrimary} />
              <Text style={styles.callBtnText}>{openingChat ? 'Opening…' : 'Message tailor'}</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order</Text>
          <Row label="Delivery date" value={formatDate(order.deliveryDate)} />
          <Row label="Stitching" value={order.stitchingType.replace('_', ' ')} />
          <Row label="Express" value={order.isExpress ? 'Yes' : 'No'} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          {Object.keys(measurements).length === 0 ? (
            <Text style={styles.muted}>None</Text>
          ) : (
            <View style={styles.grid}>
              {Object.entries(measurements).map(([k, v]) => (
                <View key={k} style={styles.measureCell}>
                  <Text style={styles.muted}>{k}</Text>
                  <Text style={styles.measureVal}>{v}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Fabric</Text>
          <View style={styles.fabricRow}>
            {order.fabric?.imageUrl ? (
              <Image source={{ uri: resolveMediaUrl(order.fabric.imageUrl) }} style={styles.fabricImg} resizeMode="cover" />
            ) : (
              <View style={styles.fabricPh}>
                <MaterialCommunityIcons name="image-outline" size={28} color={t.textMuted} />
              </View>
            )}
            <VStack style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.bold}>{order.fabric?.name ?? 'Fabric'}</Text>
            </VStack>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <Text style={styles.body}>{order.deliveryAddress}</Text>
          <Text style={[styles.muted, { marginTop: 8 }]}>Notes</Text>
          <Text style={styles.body}>{order.specialInstructions || 'None'}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Total</Text>
          <Row label="Fabric" value={formatCurrencyFromCents(order.fabricPriceCents)} />
          {order.expressFeeCents > 0 ? (
            <Row label="Express" value={formatCurrencyFromCents(order.expressFeeCents)} />
          ) : null}
          <View style={styles.divider} />
          <Row label="Total" value={formatCurrencyFromCents(order.totalCents)} bold />
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function buildCustomerOrderDetailStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    muted: { fontSize: 14, color: t.textMuted },
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
    sectionTitle: { fontSize: 16, fontWeight: '700', color: t.textPrimary, marginBottom: 10 },
    bold: { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    rowText: { fontSize: 14, color: t.textSecondary, marginTop: 4 },
    body: { fontSize: 14, color: t.textPrimary, lineHeight: 20 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    historyStatus: { fontSize: 14, color: t.textSecondary, textTransform: 'capitalize' },
    historyDate: { fontSize: 13, color: t.textMuted },
    tailorActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    callBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 0,
      alignSelf: 'flex-start',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.cardBorder,
      backgroundColor: t.isDark ? t.menuIconBg : 'transparent',
    },
    callBtnText: { fontSize: 14, fontWeight: '600', color: t.textPrimary },
    callBtnDisabled: { opacity: 0.55 },
    reviewCta: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      alignSelf: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.gold,
      backgroundColor: t.isDark ? '#422006' : '#FFFBF0',
    },
    reviewCtaText: { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    value: { fontSize: 14, color: t.textPrimary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    measureCell: { width: '50%', paddingHorizontal: 6, marginBottom: 10 },
    measureVal: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
    fabricRow: { flexDirection: 'row', alignItems: 'center' },
    fabricImg: { width: 72, height: 72, borderRadius: 8, backgroundColor: t.menuIconBg },
    fabricPh: {
      width: 72,
      height: 72,
      borderRadius: 8,
      backgroundColor: t.menuIconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: { height: 1, backgroundColor: t.divider, marginVertical: 8 },
  });
}
