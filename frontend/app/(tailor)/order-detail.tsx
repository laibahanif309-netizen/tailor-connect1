import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
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
import { Avatar, AvatarFallbackText } from '../../components/ui/avatar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GradientButton } from '../../components/common/GradientButton';
import {
  apiOrderToTailorOrderDetail,
  fetchOrderById,
  updateOrderStatus,
} from '../../services/orders';
import { ensureConversationFromOrder } from '../../services/chat';
import type { TailorOrderDetail } from '../../types/dashboard';
import { useToast } from '../../utils/toast';
import { getErrorMessage, resolveMediaUrl } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
}

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Placed',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Order detail (tailor) — GET/PATCH /api/orders
 */
export default function OrderDetailScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorOrderDetailStyles(t), [t]);
  const params = useLocalSearchParams<{ id: string }>();
  const { showError, showSuccess } = useToast();
  const [order, setOrder] = useState<TailorOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) {
      showError('Order not found', 'Missing order id.');
      router.back();
      return;
    }
    setLoading(true);
    try {
      const raw = await fetchOrderById(params.id);
      setOrder(apiOrderToTailorOrderDetail(raw));
    } catch (e: unknown) {
      showError('Order not found', getErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [params.id, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const applyStatus = useCallback(
    async (newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
      if (!order) return;
      setUpdating(true);
      try {
        const raw = await updateOrderStatus(order.id, newStatus);
        setOrder(apiOrderToTailorOrderDetail(raw));
        showSuccess('Status updated', 'Order status has been updated.');
      } catch (e: unknown) {
        showError('Update failed', getErrorMessage(e));
      } finally {
        setUpdating(false);
      }
    },
    [order, showError, showSuccess]
  );

  const handleUpdateStatus = (
    newStatus: 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    title: string,
    message: string
  ) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          void applyStatus(newStatus);
        },
      },
    ]);
  };

  const handleCall = () => {
    if (!order) return;
    const raw = order.customerPhone?.trim() ?? '';
    if (!raw) {
      showError('Info', 'No phone number available.');
      return;
    }
    const tel = raw.replace(/[\s\-().]/g, '');
    if (!/\d/.test(tel)) {
      showError('Call', 'Invalid phone number on file.');
      return;
    }
    void Linking.openURL(`tel:${tel}`).catch(() => showError('Error', 'Could not open dialer.'));
  };

  const handleMessage = useCallback(async () => {
    if (!order) return;
    try {
      const conversationId = await ensureConversationFromOrder(order.id);
      const title = order.customerName || 'Customer';
      router.push(`/(tailor)/chat/${conversationId}?title=${encodeURIComponent(title)}`);
    } catch (e: unknown) {
      showError('Chat', getErrorMessage(e));
    }
  }, [order, showError]);

  const renderPrimaryAction = () => {
    if (!order || updating) return null;
    if (order.status === 'pending')
      return (
        <GradientButton
          title="Confirm order"
          onPress={() =>
            handleUpdateStatus('confirmed', 'Confirm order', 'Mark this order as confirmed?')
          }
          style={styles.primaryButton}
        />
      );
    if (order.status === 'confirmed')
      return (
        <GradientButton
          title="Start work"
          onPress={() =>
            handleUpdateStatus('in_progress', 'Start work', 'Move this order to in progress?')
          }
          style={styles.primaryButton}
        />
      );
    if (order.status === 'in_progress')
      return (
        <GradientButton
          title="Mark complete"
          onPress={() =>
            handleUpdateStatus('completed', 'Complete order', 'Mark this order as completed?')
          }
          style={styles.primaryButton}
        />
      );
    if (order.status === 'completed')
      return <Text style={styles.completedLabel}>This order is completed.</Text>;
    if (order.status === 'cancelled')
      return <Text style={styles.cancelledLabel}>This order was cancelled.</Text>;
    return null;
  };

  const renderCancelAction = () => {
    if (!order || updating) return null;
    if (order.status === 'completed' || order.status === 'cancelled') return null;
    return (
      <Pressable
        onPress={() =>
          handleUpdateStatus(
            'cancelled',
            'Cancel order',
            'Cancel this order? The customer will see it as cancelled.'
          )
        }
        style={({ pressed }) => [styles.cancelLink, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.cancelLinkText}>Cancel order</Text>
      </Pressable>
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Order
          </Text>
          <View style={styles.topBarRight} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.loadingText}>Loading order…</Text>
        </View>
      </View>
    );
  }

  const deliveryDate = order.scheduledDelivery
    ? format(new Date(order.scheduledDelivery), 'MMM dd, yyyy')
    : '—';

  const history = order.statusHistory ?? [];

  return (
    <View style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {order.orderNumber}
        </Text>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Status history</Text>
          <View style={styles.timeline}>
            {history.length === 0 ? (
              <Text style={styles.muted}>No history yet.</Text>
            ) : (
              history.map((entry, i) => {
                const isLast = i === history.length - 1;
                const label = STATUS_LABELS[entry.status] ?? entry.status;
                return (
                  <View key={`${entry.at}-${i}`} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, styles.timelineDotActive]} />
                      {!isLast && <View style={[styles.timelineLine, styles.timelineLineActive]} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabelCurrent}>{label}</Text>
                      <Text style={styles.timelineDate}>{format(new Date(entry.at), 'MMM dd, yyyy')}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order information</Text>
          <VStack space="sm">
            <View style={styles.row}>
              <Text style={styles.label}>Order number</Text>
              <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Order date</Text>
              <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Delivery date</Text>
              <Text style={styles.value}>{deliveryDate}</Text>
            </View>
            {order.stitchingType ? (
              <View style={styles.row}>
                <Text style={styles.label}>Stitching</Text>
                <Text style={styles.value}>{order.stitchingType.replace('_', ' ')}</Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <StatusBadge status={order.status} size="md" />
            </View>
          </VStack>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          {Object.keys(order.measurements).length === 0 ? (
            <Text style={styles.muted}>No measurements recorded.</Text>
          ) : (
            <View style={styles.measurementsGrid}>
              {Object.entries(order.measurements).map(([label, value]) => (
                <View key={label} style={styles.measurementRow}>
                  <Text style={styles.measurementLabel}>{label}</Text>
                  <Text style={styles.measurementValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Fabric</Text>
          <View style={styles.fabricRow}>
            {order.fabric.imageUri ? (
              <Image source={{ uri: resolveMediaUrl(order.fabric.imageUri) }} style={styles.fabricImage} resizeMode="cover" />
            ) : (
              <View style={styles.fabricImagePlaceholder}>
                <MaterialCommunityIcons name="image-outline" size={32} color={t.textMuted} />
              </View>
            )}
            <VStack style={styles.fabricInfo}>
              <Text style={styles.fabricName}>{order.fabric.name}</Text>
              <Text style={styles.fabricPrice}>{formatCurrency(order.fabric.price)}</Text>
            </VStack>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <VStack space="xs">
            <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
            <Text style={styles.label}>Special instructions</Text>
            <Text style={styles.value}>{order.specialInstructions || 'None'}</Text>
          </VStack>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Price breakdown</Text>
          <VStack space="xs">
            <View style={styles.row}>
              <Text style={styles.label}>Fabric</Text>
              <Text style={styles.value}>{formatCurrency(order.priceBreakdown.fabricPrice)}</Text>
            </View>
            {order.priceBreakdown.expressFee > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Express fee</Text>
                <Text style={styles.value}>{formatCurrency(order.priceBreakdown.expressFee)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{formatCurrency(order.priceBreakdown.total)}</Text>
            </View>
          </VStack>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerRow}>
            <Avatar size="lg" style={styles.avatar}>
              <AvatarFallbackText>{getInitials(order.customerName)}</AvatarFallbackText>
            </Avatar>
            <VStack style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customerName}</Text>
              <Text style={styles.customerContact}>{order.customerPhone || '—'}</Text>
              <Text style={styles.customerContact}>{order.customerEmail}</Text>
            </VStack>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleCall}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialCommunityIcons name="phone" size={22} color={t.textPrimary} />
              <Text style={styles.iconButtonLabel}>Call</Text>
            </Pressable>
            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialCommunityIcons name="message-text" size={22} color={t.textPrimary} />
              <Text style={styles.iconButtonLabel}>Message</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Update status</Text>
          <View style={styles.statusUpdateRow}>
            <Text style={styles.label}>Current status</Text>
            <StatusBadge status={order.status} size="md" />
          </View>
          <View style={styles.buttonWrap}>{renderPrimaryAction()}</View>
          <View style={styles.cancelWrap}>{renderCancelAction()}</View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function buildTailorOrderDetailStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: t.textSecondary,
    },
    muted: {
      fontSize: 14,
      color: t.textMuted,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
      backgroundColor: t.headerBg,
    },
    backButton: { padding: 4 },
    backButtonPressed: { opacity: 0.7 },
    topBarTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    topBarRight: { width: 32 },
    scroll: { flex: 1 },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      padding: 20,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    label: { fontSize: 14, color: t.textMuted },
    value: { fontSize: 14, color: t.textPrimary, fontWeight: '500' },
    orderNumberText: { fontSize: 16, fontWeight: '700', color: t.gold },
    divider: {
      height: 1,
      backgroundColor: t.divider,
      marginVertical: 8,
    },
    totalLabel: { fontSize: 14, color: t.textPrimary, fontWeight: '600' },
    total: { fontSize: 18, fontWeight: '700', color: t.gold },

    timeline: { marginLeft: 4 },
    timelineRow: { flexDirection: 'row', minHeight: 44 },
    timelineLeft: { position: 'relative', alignItems: 'center', width: 24 },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: t.cardBorder,
    },
    timelineDotActive: { backgroundColor: t.gold },
    timelineLine: {
      position: 'absolute',
      top: 14,
      left: 5,
      width: 2,
      flex: 1,
      minHeight: 28,
      backgroundColor: t.cardBorder,
    },
    timelineLineActive: { backgroundColor: t.gold },
    timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 8 },
    timelineLabelCurrent: { fontSize: 14, color: t.textPrimary, fontWeight: '700' },
    timelineDate: { fontSize: 12, color: t.textMuted, marginTop: 2 },

    measurementsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    measurementRow: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    measurementLabel: { fontSize: 13, color: t.textMuted, marginBottom: 2 },
    measurementValue: { fontSize: 15, fontWeight: '600', color: t.textPrimary },

    fabricRow: { flexDirection: 'row', alignItems: 'center' },
    fabricImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: t.menuIconBg,
    },
    fabricImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: t.menuIconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabricInfo: { marginLeft: 16, flex: 1 },
    fabricName: { fontSize: 16, fontWeight: '600', color: t.textPrimary, marginBottom: 4 },
    fabricPrice: { fontSize: 16, fontWeight: '700', color: t.gold },

    deliveryAddress: { fontSize: 14, color: t.textPrimary, lineHeight: 20 },

    customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { backgroundColor: t.menuIconBg },
    customerInfo: { marginLeft: 16, flex: 1 },
    customerName: { fontSize: 16, fontWeight: '600', color: t.textPrimary, marginBottom: 4 },
    customerContact: { fontSize: 14, color: t.textSecondary, marginBottom: 2 },
    actionRow: { flexDirection: 'row', gap: 16 },
    iconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
      backgroundColor: t.isDark ? t.menuIconBg : 'transparent',
    },
    iconButtonPressed: { opacity: 0.7 },
    iconButtonLabel: { fontSize: 14, fontWeight: '600', color: t.textPrimary, marginLeft: 8 },

    statusUpdateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    buttonWrap: { marginTop: 4 },
    cancelWrap: { marginTop: 16, alignItems: 'center' },
    cancelLink: { paddingVertical: 8 },
    cancelLinkText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
    primaryButton: { alignSelf: 'stretch' },
    completedLabel: { fontSize: 14, color: '#10B981', fontWeight: '600' },
    cancelledLabel: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
    bottomSpacer: { height: 24 },
  });
}
