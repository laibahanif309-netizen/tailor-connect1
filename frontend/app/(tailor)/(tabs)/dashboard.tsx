import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList as RNFlatList,
  Pressable,
  Text as RNText,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { VStack } from '../../../components/ui/vstack';
import { Text } from '../../../components/ui/text';
import { Heading } from '../../../components/ui/heading';
import { Spinner } from '../../../components/ui/spinner';
import { StatCard } from '../../../components/common/StatCard';
import { QuickActionCard } from '../../../components/common/QuickActionCard';
import { RecentOrderCard } from '../../../components/common/RecentOrderCard';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { DonutChartCard } from '../../../components/charts/DonutChartCard';
import { AnalyticsBarChartCard } from '../../../components/charts/AnalyticsBarChartCard';
import { FabricBreakdownCard } from '../../../components/charts/FabricBreakdownCard';
import { getCurrentUser } from '../../../services/auth';
import { getTailorDashboard } from '../../../services/dashboard';
import type { DashboardRange, DashboardResponse } from '../../../types/dashboard';
import { useToast } from '../../../utils/toast';
import { useAppScreenTheme, type AppScreenTheme } from '../../../hooks/useAppScreenTheme';

const RANGE_OPTIONS: { key: DashboardRange; label: string }[] = [
  { key: '7d', label: 'Week' },
  { key: '30d', label: 'Month' },
  { key: '365d', label: 'Year' },
];

/** Background refresh while tab is shown (ms). */
const POLL_INTERVAL_MS = 90_000;

/**
 * Tailor Dashboard — real analytics from GET /api/tailors/me/dashboard.
 * Refreshes on pull-to-refresh, when the tab gains focus, when the time range changes,
 * and periodically while this screen is mounted.
 */
export default function DashboardScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorDashboardStyles(t), [t]);

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [range, setRange] = useState<DashboardRange>('30d');
  const hasLoadedRef = useRef(false);
  const rangeRef = useRef(range);
  const skipNextFocusRef = useRef(true);
  rangeRef.current = range;
  const { showError } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role === 'tailor') {
          setSessionReady(true);
        } else {
          showError('Error', 'User not authenticated as tailor');
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        showError('Error', 'Failed to load user data');
      }
    };
    void fetchUser();
  }, [showError]);

  const load = useCallback(
    async (mode: 'initial' | 'pull' | 'silent') => {
      if (!sessionReady) return;
      if (mode === 'silent') {
        try {
          const data = await getTailorDashboard(range);
          setDashboardData(data);
          hasLoadedRef.current = true;
        } catch (error) {
          console.error('Dashboard silent refresh:', error);
        }
        return;
      }
      if (mode === 'pull') setRefreshing(true);
      else setLoading(true);
      try {
        const data = await getTailorDashboard(range);
        setDashboardData(data);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Error', 'Failed to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionReady, range, showError]
  );

  useEffect(() => {
    if (!sessionReady) return;
    void load(hasLoadedRef.current ? 'pull' : 'initial');
  }, [sessionReady, range, load]);

  useFocusEffect(
    useCallback(() => {
      if (!sessionReady) return undefined;
      if (skipNextFocusRef.current) {
        skipNextFocusRef.current = false;
        return undefined;
      }
      void (async () => {
        try {
          const data = await getTailorDashboard(rangeRef.current);
          setDashboardData(data);
          hasLoadedRef.current = true;
        } catch (error) {
          console.error('Dashboard focus refresh:', error);
        }
      })();
      return undefined;
    }, [sessionReady])
  );

  useEffect(() => {
    if (!sessionReady) return undefined;
    const id = setInterval(() => {
      void load('silent');
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionReady, load]);

  const handleRefresh = useCallback(() => {
    void load('pull');
  }, [load]);

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  const getOrderStatusChartData = (data: DashboardResponse) => {
    const statusColors: Record<string, string> = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      in_progress: '#6366F1',
      completed: '#10B981',
      cancelled: '#EF4444',
    };
    return data.chartData.orderStatusDistribution.map((item) => ({
      label: item.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: item.count,
      color: statusColors[item.status] || '#9CA3AF',
    }));
  };

  const getStitchingChartData = (data: DashboardResponse) => {
    const colors: Record<string, string> = {
      mens: '#3B82F6',
      womens: '#EC4899',
      childrens: '#F59E0B',
    };
    const labels: Record<string, string> = {
      mens: "Men's",
      womens: "Women's",
      childrens: "Children's",
    };
    return data.chartData.stitchingBreakdown
      .filter((s) => s.count > 0)
      .map((s) => ({
        label: labels[s.stitchingType] ?? s.stitchingType,
        value: s.count,
        color: colors[s.stitchingType] ?? '#94A3B8',
      }));
  };

  const handleViewOrders = () => {
    router.push('/(tailor)/(tabs)/orders');
  };

  const handleManagePortfolio = () => {
    router.push('/(tailor)/portfolio-management');
  };

  const handleManageFabrics = () => {
    router.push('/(tailor)/fabric-management');
  };

  const handleEditProfile = () => {
    router.push('/(tailor)/profile-edit');
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(tailor)/order-detail?id=${orderId}`);
  };

  const handleViewAllOrders = () => {
    router.push('/(tailor)/(tabs)/orders');
  };

  if (loading && !dashboardData) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Spinner size="large" color={t.gold} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  if (!dashboardData && !loading) {
    return (
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.gold} />
          }
        >
          <EmptyState
            icon="alert-circle-outline"
            title="Failed to load dashboard"
            subtitle="Please pull down to refresh or try again later"
            actionLabel="Retry"
            onAction={handleRefresh}
          />
        </ScrollView>
      </View>
    );
  }

  if (!dashboardData) return null;

  const { stats, recentOrders, chartData, range: activeRange, granularity } = dashboardData;
  const orderStatusChartData = getOrderStatusChartData(dashboardData);
  const stitchingChartData = getStitchingChartData(dashboardData);
  const totalOrdersForChart = stats.totalOrders;

  const rangeSubtitle =
    activeRange === '7d'
      ? 'Last 7 days (daily)'
      : activeRange === '365d'
        ? 'Last 12 months (monthly buckets)'
        : 'Last 30 days (daily)';

  const ordersChartTitle = granularity === 'month' ? 'Orders by month' : 'Orders per day';
  const revenueChartTitle = granularity === 'month' ? 'Completed revenue by month' : 'Completed revenue per day';

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.gold} />
        }
      >
        <VStack space="lg" style={styles.container}>
          <VStack space="xs">
            <Heading style={styles.sectionTitle}>Analytics</Heading>
           
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rangeScroll}
            >
              {RANGE_OPTIONS.map((opt) => {
                const isActive = range === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setRange(opt.key)}
                    style={[styles.rangeChip, isActive && styles.rangeChipActive]}
                  >
                    <RNText style={[styles.rangeLabel, isActive && styles.rangeLabelActive]}>{opt.label}</RNText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.rangeMeta}>{rangeSubtitle}</Text>
          </VStack>

          <View style={styles.statsGrid}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <StatCard value={stats.totalOrders} label="Orders (period)" icon="clipboard-text" />
              </View>
              <View style={styles.statItem}>
                <StatCard
                  value={stats.pendingOrders}
                  label="Pending"
                  icon="clock-outline"
                  iconColor="#F59E0B"
                />
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <StatCard
                  value={stats.confirmedOrders}
                  label="Confirmed"
                  icon="check-decagram"
                  iconColor="#3B82F6"
                />
              </View>
              <View style={styles.statItem}>
                <StatCard
                  value={stats.inProgressOrders}
                  label="In progress"
                  icon="progress-clock"
                  iconColor="#6366F1"
                />
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <StatCard
                  value={stats.completedOrders}
                  label="Completed"
                  icon="check-circle"
                  iconColor="#10B981"
                />
              </View>
              <View style={styles.statItem}>
                <StatCard
                  value={stats.cancelledOrders}
                  label="Cancelled"
                  icon="close-circle"
                  iconColor="#EF4444"
                />
              </View>
            </View>
            <View style={styles.statFull}>
              <StatCard
                value={formatCurrency(stats.totalEarnings)}
                label="Revenue (completed, period)"
                icon="cash"
                iconColor={t.gold}
                subLabel={`All time: ${formatCurrency(stats.allTimeEarnings)} · ${stats.allTimeOrderCount} orders`}
              />
            </View>
          </View>

          <VStack space="md">
            <AnalyticsBarChartCard
              title={ordersChartTitle}
              subtitle={`${totalOrdersForChart} orders in period`}
              data={chartData.ordersOverTime}
            />
            <AnalyticsBarChartCard
              title={revenueChartTitle}
              subtitle="From completed orders only (PKR)"
              data={chartData.earningsOverTime}
              barColor="#10B981"
            />
            <DonutChartCard
              title="Order status"
              subtitle={rangeSubtitle}
              data={orderStatusChartData}
              height={240}
              centerText={totalOrdersForChart}
              titleIcon="chart-donut"
              titleIconColor={t.gold}
            />
            {stitchingChartData.length > 0 ? (
              <DonutChartCard
                title="Stitching type"
                subtitle="Men's vs women's vs children's"
                data={stitchingChartData}
                height={220}
                centerText={totalOrdersForChart}
                titleIcon="human-male-female-child"
                titleIconColor={t.gold}
              />
            ) : null}
            <FabricBreakdownCard
              title="Fabrics / materials"
              subtitle="Share of orders in this period (by fabric)"
              items={chartData.fabricBreakdown}
            />
          </VStack>

          <VStack space="sm">
            <Heading style={styles.sectionTitle}>Quick Actions</Heading>
            <View style={styles.quickActionsGrid}>
              <View style={styles.quickActionRow}>
                <QuickActionCard icon="clipboard-text" label="View Orders" onPress={handleViewOrders} />
                <QuickActionCard icon="image-multiple" label="Manage Portfolio" onPress={handleManagePortfolio} />
              </View>
              <View style={styles.quickActionRow}>
                <QuickActionCard icon="texture" label="Manage Fabrics" onPress={handleManageFabrics} />
                <QuickActionCard icon="account-edit" label="Edit Profile" onPress={handleEditProfile} />
              </View>
            </View>
          </VStack>

          <VStack space="sm">
            <SectionHeader
              title="Recent Orders"
              actionLabel={recentOrders.length > 0 ? 'View All' : undefined}
              onAction={recentOrders.length > 0 ? handleViewAllOrders : undefined}
            />
            {recentOrders.length > 0 ? (
              <RNFlatList
                data={recentOrders.slice(0, 2)}
                renderItem={({ item }) => (
                  <RecentOrderCard order={item} onPress={() => handleOrderPress(item.id)} />
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <EmptyState
                    icon="clipboard-text-outline"
                    title="No recent orders"
                    subtitle="Orders will appear here once you receive them"
                  />
                }
              />
            ) : (
              <EmptyState
                icon="clipboard-text-outline"
                title="No recent orders"
                subtitle="Orders will appear here once you receive them"
              />
            )}
          </VStack>
        </VStack>
      </ScrollView>
    </View>
  );
}

function buildTailorDashboardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    container: {
      flex: 1,
      gap: 12,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: t.textSecondary,
      marginTop: 12,
    },
    statsGrid: {
      gap: 12,
    },
    statRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statItem: {
      flex: 1,
    },
    statFull: {
      width: '100%',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 8,
    },
    analyticsHint: {
      fontSize: 12,
      color: t.textSecondary,
      lineHeight: 18,
    },
    rangeScroll: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 8,
    },
    rangeChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: t.filterTabIdleBg,
      marginRight: 8,
    },
    rangeChipActive: {
      backgroundColor: t.gold,
    },
    rangeLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: t.filterTabLabel,
    },
    rangeLabelActive: {
      color: '#FFFFFF',
    },
    rangeMeta: {
      fontSize: 12,
      color: t.textMuted,
    },
    quickActionsGrid: {
      gap: 12,
    },
    quickActionRow: {
      flexDirection: 'row',
      gap: 12,
    },
  });
}
