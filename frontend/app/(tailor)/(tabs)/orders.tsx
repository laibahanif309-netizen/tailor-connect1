import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  Text as RNText,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function stitchingSearchAliases(stitch: string | undefined): string {
  if (!stitch) return '';
  const map: Record<string, string> = {
    mens: "men's mens male",
    womens: "women's womens female",
    childrens: "children's childrens kids child",
  };
  return `${stitch} ${map[stitch] ?? ''}`;
}

function orderMatchesSearch(order: RecentOrder, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  const fabric = (order.fabricName ?? '').toLowerCase();
  const customer = (order.customerName ?? '').toLowerCase();
  const number = (order.orderNumber ?? '').toLowerCase();
  const id = (order.id ?? '').toLowerCase();
  const stitchBlob = stitchingSearchAliases(order.stitchingType).toLowerCase();
  const haystack = `${number} ${id} ${customer} ${fabric} ${stitchBlob}`;
  return haystack.includes(q);
}

/**
 * Tailor Orders — GET /api/orders (JWT)
 */
export default function OrdersScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorOrdersStyles(t), [t]);

  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const filteredOrders = useMemo(
    () => orders.filter((o) => orderMatchesSearch(o, searchQuery)),
    [orders, searchQuery]
  );

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
    router.push(`/(tailor)/order-detail?id=${orderId}`);
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

  const showNoMatches = !loading && orders.length > 0 && filteredOrders.length === 0 && searchQuery.trim().length > 0;

  return (
    <View style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <RNText style={styles.screenTitle}>Orders</RNText>
        </View>
        {renderFilterTabs()}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color={t.gold} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search order #, customer, fabric…"
              placeholderTextColor={t.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10} style={styles.searchClear}>
                <MaterialCommunityIcons name="close-circle" size={20} color={t.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
        {loading && orders.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={t.gold} />
            <Text style={styles.loadingHint}>Loading orders…</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="clipboard-text-outline"
              title="No orders"
              subtitle={
                activeFilter === 'all'
                  ? 'Orders will appear here when customers place them'
                  : `No ${FILTER_TABS.find((x) => x.key === activeFilter)?.label?.toLowerCase()} orders`
              }
            />
          </View>
        ) : showNoMatches ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="magnify"
              title="No matches"
              subtitle="Try a different order number, customer name, or fabric keyword"
            />
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.gold} />
            }
          />
        )}
      </View>
    </View>
  );
}

function buildTailorOrdersStyles(t: AppScreenTheme) {
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
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: t.filterTabIdleBg,
    },
    filterTabActive: {
      backgroundColor: t.gold,
    },
    filterTabLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: t.filterTabLabel,
    },
    filterTabLabelActive: {
      color: '#FFFFFF',
    },
    searchSection: {
      backgroundColor: t.headerBg,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.headerBorder,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.searchBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
      paddingHorizontal: 12,
      minHeight: 46,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: t.inputText,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    },
    searchClear: {
      padding: 4,
      marginLeft: 4,
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
