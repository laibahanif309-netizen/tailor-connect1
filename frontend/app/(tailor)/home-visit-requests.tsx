import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/common/EmptyState';
import { fetchHomeVisits, updateHomeVisitStatus } from '../../services/homeVisits';
import type { HomeVisitItem, HomeVisitStatusApi } from '../../types/homeVisit';
import { useToast } from '../../utils/toast';
import { getErrorMessage } from '../../services/api';
import { format } from 'date-fns';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

type HomeVisitStyles = ReturnType<typeof buildHomeVisitRequestsStyles>;

export default function HomeVisitRequestsScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildHomeVisitRequestsStyles(t), [t]);
  const { showError, showSuccess } = useToast();
  const [visits, setVisits] = useState<HomeVisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHomeVisits({ page: 1, limit: 50 });
      setVisits(data.homeVisits);
    } catch (e: unknown) {
      showError('Home visits', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchHomeVisits({ page: 1, limit: 50 });
      setVisits(data.homeVisits);
    } catch (e: unknown) {
      showError('Home visits', getErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const act = async (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    setBusyId(id);
    try {
      await updateHomeVisitStatus(id, status);
      showSuccess('Updated', 'Home visit status was updated.');
      await load();
    } catch (e: unknown) {
      showError('Home visits', getErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Home visit requests</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading && visits.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : visits.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={t.gold} />
          }
        >
          <EmptyState
            icon="calendar-clock"
            title="No requests yet"
            subtitle="When customers book a home visit, they will appear here."
          />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={t.gold} />
          }
        >
          {visits.map((v) => (
            <VisitCard key={v.id} visit={v} busy={busyId === v.id} onAction={act} styles={styles} theme={t} />
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

function VisitCard({
  visit,
  busy,
  onAction,
  styles,
  theme,
}: {
  visit: HomeVisitItem;
  busy: boolean;
  onAction: (id: string, s: 'confirmed' | 'completed' | 'cancelled') => void;
  styles: HomeVisitStyles;
  theme: AppScreenTheme;
}) {
  const c = visit.customer;
  const name = c?.name ?? 'Customer';
  const dateLabel = format(new Date(visit.requestedDate), 'MMM d, yyyy');

  return (
    <Card style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.name}>{name}</Text>
        <StatusPill status={visit.status} styles={styles} theme={theme} />
      </View>
      <Text style={styles.meta}>{dateLabel} · {visit.timeSlot}</Text>
      <Text style={styles.body}>{visit.address}</Text>
      <Text style={styles.meta}>Phone: {visit.phone}</Text>
      {visit.purpose ? <Text style={styles.purpose}>{visit.purpose}</Text> : null}

      <View style={styles.actions}>
        {visit.status === 'pending' ? (
          <>
            <ActionBtn label="Confirm" onPress={() => onAction(visit.id, 'confirmed')} disabled={busy} primary styles={styles} />
            <ActionBtn label="Decline" onPress={() => onAction(visit.id, 'cancelled')} disabled={busy} styles={styles} />
          </>
        ) : null}
        {visit.status === 'confirmed' ? (
          <>
            <ActionBtn label="Mark complete" onPress={() => onAction(visit.id, 'completed')} disabled={busy} primary styles={styles} />
            <ActionBtn label="Cancel" onPress={() => onAction(visit.id, 'cancelled')} disabled={busy} styles={styles} />
          </>
        ) : null}
      </View>
    </Card>
  );
}

function StatusPill({
  status,
  styles,
  theme,
}: {
  status: HomeVisitStatusApi;
  styles: HomeVisitStyles;
  theme: AppScreenTheme;
}) {
  const colors: Record<HomeVisitStatusApi, string> = {
    pending: '#D97706',
    confirmed: '#059669',
    completed: theme.textSecondary,
    cancelled: theme.textMuted,
  };
  return (
    <View style={[styles.pill, { borderColor: colors[status] }]}>
      <Text style={[styles.pillText, { color: colors[status] }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  disabled,
  primary,
  styles,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  styles: HomeVisitStyles;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionBtn,
        primary ? styles.actionPrimary : styles.actionOutline,
        disabled && styles.actionDisabled,
      ]}
    >
      <Text style={[styles.actionBtnText, primary && styles.actionBtnTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function buildHomeVisitRequestsStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.screenBg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    muted: { marginTop: 8, fontSize: 14, color: t.textSecondary },
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
    emptyScroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    card: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
      backgroundColor: t.cardBg,
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 17, fontWeight: '700', color: t.textPrimary, flex: 1, marginRight: 8 },
    meta: { fontSize: 13, color: t.textSecondary, marginTop: 6 },
    body: { fontSize: 14, color: t.textPrimary, marginTop: 8, lineHeight: 20 },
    purpose: { fontSize: 14, color: t.cardBody, marginTop: 8, fontStyle: 'italic' },
    pill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: t.searchBg,
    },
    pillText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    actionBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      minWidth: 110,
      alignItems: 'center',
    },
    actionPrimary: {
      backgroundColor: t.isDark ? t.gold : '#1D3A5F',
    },
    actionOutline: {
      borderWidth: 1,
      borderColor: t.cardBorder,
      backgroundColor: t.cardBg,
    },
    actionDisabled: { opacity: 0.5 },
    actionBtnText: { fontSize: 14, fontWeight: '700', color: t.textPrimary },
    actionBtnTextPrimary: {
      color: t.isDark ? t.screenBg : '#FFFFFF',
    },
  });
}
