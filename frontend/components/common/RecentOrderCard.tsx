import React, { useMemo } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Card } from '../ui/card';
import { VStack } from '../ui/vstack';
import { Text } from '../ui/text';
import { StatusBadge } from './StatusBadge';
import type { RecentOrder } from '../../types/dashboard';
import { format } from 'date-fns';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface RecentOrderCardProps {
  /**
   * Order data to display
   */
  order: RecentOrder;
  /**
   * Callback when card is pressed
   */
  onPress: () => void;
}

/**
 * RecentOrderCard - Card component for displaying recent order information
 * 
 * @example
 * ```tsx
 * <RecentOrderCard 
 *   order={orderData}
 *   onPress={() => router.push(`/order/${order.id}`)}
 * />
 * ```
 */
export const RecentOrderCard: React.FC<RecentOrderCardProps> = ({
  order,
  onPress,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildRecentOrderCardStyles(t), [t]);
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
  };

  const formatCurrency = (amount: number): string => {
    return `PKR ${amount.toLocaleString('en-PK')}`;
  };

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <VStack space="sm">
          <View style={styles.topRow}>
            <VStack style={styles.leftContent}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.customerName}>
                {order.tailorName ?? order.customerName}
              </Text>
            </VStack>
            <StatusBadge status={order.status} size="sm" />
          </View>
          
          <View style={styles.bottomRow}>
            <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
            <Text style={styles.total}>{formatCurrency(order.total)}</Text>
          </View>
        </VStack>
      </Card>
    </Pressable>
  );
};

function buildRecentOrderCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    pressable: {
      marginBottom: 12,
    },
    card: {
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    leftContent: {
      flex: 1,
      alignItems: 'flex-start',
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: t.textPrimary,
      marginBottom: 4,
    },
    customerName: {
      fontSize: 14,
      color: t.textSecondary,
      fontWeight: '500',
    },
    date: {
      fontSize: 12,
      color: t.textMuted,
    },
    total: {
      fontSize: 16,
      fontWeight: '700',
      color: t.gold,
    },
  });
}

RecentOrderCard.displayName = 'RecentOrderCard';

