import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from '../../components/ui/scroll-view';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { StarRating, GradientButton, CharacterCounter } from '../../components/common';
import { fetchOrderById } from '../../services/orders';
import { submitOrderReview } from '../../services/reviews';
import type { OrderDetailApi } from '../../types/order';
import { useToast } from '../../utils/toast';
import { getErrorMessage } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function WriteReviewScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildWriteReviewStyles(t), [t]);
  const params = useLocalSearchParams<{ orderId: string }>();
  const orderId = normalizeParam(params.orderId);
  const { showError, showSuccess } = useToast();
  const [order, setOrder] = useState<OrderDetailApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) {
      showError('Review', 'Missing order.');
      router.back();
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOrderById(orderId);
      if (data.status !== 'completed') {
        showError('Review', 'You can only review completed orders.');
        router.back();
        return;
      }
      if (data.review) {
        showError('Review', 'You already submitted a review for this order.');
        router.back();
        return;
      }
      setOrder(data);
    } catch (e: unknown) {
      showError('Review', getErrorMessage(e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [orderId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async () => {
    if (!orderId || !order || submitting) return;
    const trimmed = comment.trim();
    if (trimmed.length < 3) {
      showError('Review', 'Please write at least a few words (3 characters minimum).');
      return;
    }
    setSubmitting(true);
    try {
      await submitOrderReview({ orderId, rating, comment: trimmed });
      showSuccess('Thanks!', 'Your review was posted.');
      router.replace(`/(customer)/order-detail?id=${encodeURIComponent(orderId)}`);
    } catch (e: unknown) {
      showError('Review', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle}>Write a review</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.muted}>Loading order…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Write a review</Text>
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
          <Text style={styles.bold}>{order.tailor.businessName}</Text>
          <Text style={styles.muted}>{order.orderNumber}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Rating</Text>
          <StarRating rating={rating} interactive size={36} onRatingChange={setRating} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.label}>Comments</Text>
          <TextInput
            style={styles.input}
            placeholder="Share your experience with this tailor…"
            placeholderTextColor={t.textMuted}
            multiline
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
            maxLength={2000}
          />
          <CharacterCounter current={comment.length} max={2000} />
        </Card>

        <GradientButton
          title="Submit review"
          onPress={() => void handleSubmit()}
          height={48}
          borderRadius={24}
          disabled={comment.trim().length < 3}
          isLoading={submitting}
          loadingText="Submitting…"
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function buildWriteReviewStyles(t: AppScreenTheme) {
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
    label: { fontSize: 14, fontWeight: '600', color: t.textSecondary, marginBottom: 10 },
    bold: { fontSize: 17, fontWeight: '700', color: t.textPrimary },
    input: {
      minHeight: 140,
      fontSize: 15,
      color: t.inputText,
      lineHeight: 22,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.cardBorder,
      backgroundColor: t.searchBg,
      marginBottom: 8,
    },
  });
}
