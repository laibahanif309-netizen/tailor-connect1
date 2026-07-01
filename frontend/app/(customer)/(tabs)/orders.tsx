import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  Text as RNText,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { RecentOrderCard } from '../../../components/common/RecentOrderCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { fetchOrdersList, listItemToRecentOrder } from '../../../services/orders';
import type { RecentOrder } from '../../../types/dashboard';
import { useToast } from '../../../utils/toast';
import { getErrorMessage } from '../../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../../hooks/useAppScreenTheme';

type FilterTab = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/**
 * Customer orders — GET /api/orders
 */
export default function CustomerOrdersScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildCustomerOrdersStyles(t), [t]);

  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      const params =
        activeFilter === 'all'
          ? { page: 1, limit: 50 }
          : { page: 1, limit: 50, status: activeFilter };
      const data = await fetchOrdersList(params);
      setOrders(data.orders.map(listItemToRecentOrder));
    } catch (error: unknown) {
      showError('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, showError]);

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const handleOrderPress = useCallback((orderId: string) => {
    router.push(`/(customer)/order-detail?id=${orderId}`);
  }, []);

  const renderOrderItem = useCallback(
    ({ item }: { item: RecentOrder }) => (
      <RecentOrderCard order={item} onPress={() => handleOrderPress(item.id)} />
    ),
    [handleOrderPress]
  );

  const renderFilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterTabsContent}
      style={styles.filterTabsScroll}
    >
      {FILTER_TABS.map((tab) => {
        const isActive = activeFilter === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => setActiveFilter(tab.key)}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterTabLabel,
                isActive && styles.filterTabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <RNText style={styles.screenTitle}>My orders</RNText>
        </View>
        {renderFilterTabs()}
        {loading && orders.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={t.gold} />
            <Text style={styles.loadingHint}>Loading orders…</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="clipboard-text-outline"
              title="No orders yet"
              subtitle={
                activeFilter === 'all'
                  ? 'Place an order from a tailor profile to see it here'
                  : `No ${FILTER_TABS.find((t) => t.key === activeFilter)?.label?.toLowerCase()} orders`
              }
            />
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.gold} />
            }
          />
        )}
      </View>
    </View>
  );
}

function buildCustomerOrdersStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    content: {
      flex: 1,
    },
    header: {
      backgroundColor: t.headerBg,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: t.rnTitleColor,
    },
    filterTabsScroll: {
      backgroundColor: t.headerBg,
      maxHeight: 72,
    },
    filterTabsContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: t.filterTabIdleBg,
    },
    filterTabActive: {
      backgroundColor: t.gold,
    },
    filterTabLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: t.filterTabLabel,
    },
    filterTabLabelActive: {
      color: '#FFFFFF',
    },
    emptyWrapper: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingHint: {
      fontSize: 14,
      color: t.textSecondary,
    },
    list: {
      flex: 1,
      backgroundColor: t.listBg,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
  });
}
