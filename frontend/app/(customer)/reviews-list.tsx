import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../../components/ui/text';
import { ReviewCard, EmptyState } from '../../components/common';
import { fetchTailorReviewsPage } from '../../services/reviews';
import type { ReviewItem } from '../../types/tailor';
import { useToast } from '../../utils/toast';
import { getErrorMessage } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

const PAGE_SIZE = 20;

export default function ReviewsListScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildReviewsListStyles(t), [t]);
  const params = useLocalSearchParams<{ tailorId: string; title?: string }>();
  const tailorId = normalizeParam(params.tailorId);
  const title = normalizeParam(params.title) || 'Reviews';
  const { showError } = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!tailorId) return;
      const data = await fetchTailorReviewsPage(tailorId, { page: nextPage, limit: PAGE_SIZE });
      if (append) {
        setReviews((prev) => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setPage(nextPage);
    },
    [tailorId]
  );

  const bootstrap = useCallback(async () => {
    if (!tailorId) {
      showError('Reviews', 'Missing tailor.');
      router.back();
      return;
    }
    setInitialLoading(true);
    try {
      await loadPage(1, false);
    } catch (e: unknown) {
      showError('Reviews', getErrorMessage(e));
      router.back();
    } finally {
      setInitialLoading(false);
    }
  }, [tailorId, loadPage, showError]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const onRefresh = useCallback(async () => {
    if (!tailorId) return;
    setRefreshing(true);
    try {
      await loadPage(1, false);
    } catch (e: unknown) {
      showError('Reviews', getErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [tailorId, loadPage, showError]);

  const onEndReached = useCallback(async () => {
    if (!tailorId || loadingMoreRef.current || page >= totalPages || totalPages === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await loadPage(page + 1, true);
    } catch (e: unknown) {
      showError('Reviews', getErrorMessage(e));
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }, [tailorId, loadPage, page, totalPages, showError]);

  if (initialLoading) {
    return (
      <View style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={t.textPrimary} />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.muted}>Loading reviews…</Text>
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
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="comment-text-outline"
            title="No reviews yet"
            subtitle="Reviews will appear here once customers share their experience."
          />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={t.gold} />
          }
          onEndReached={() => void onEndReached()}
          onEndReachedThreshold={0.35}
          ListHeaderComponent={
            total > 0 ? (
              <Text style={styles.count}>
                {total} {total === 1 ? 'review' : 'reviews'}
              </Text>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={t.gold} />
              </View>
            ) : (
              <View style={{ height: 24 }} />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ReviewCard review={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function buildReviewsListStyles(t: AppScreenTheme) {
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
    listContent: { padding: 16, paddingBottom: 40 },
    count: { fontSize: 14, color: t.textSecondary, marginBottom: 12 },
    cardWrap: { marginBottom: 12 },
    footer: { paddingVertical: 16, alignItems: 'center' },
    emptyWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  });
}
