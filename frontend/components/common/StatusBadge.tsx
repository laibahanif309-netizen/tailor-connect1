import React from 'react';
import { StyleSheet } from 'react-native';
import { Box } from '../ui/box';
import { Text } from '../ui/text';

export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  /**
   * Status value
   */
  status: OrderStatus;
  /**
   * Custom label (optional, defaults to capitalized status)
   */
  label?: string;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<OrderStatus, { color: string; bgColor: string; label: string }> = {
  pending: {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    label: 'Pending',
  },
  confirmed: {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    label: 'Confirmed',
  },
  in_progress: {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    label: 'In Progress',
  },
  completed: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    label: 'Completed',
  },
  cancelled: {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    label: 'Cancelled',
  },
};

/**
 * StatusBadge - Display order/booking status with color coding
 * 
 * @example
 * ```tsx
 * <StatusBadge status="pending" />
 * <StatusBadge status="completed" size="lg" />
 * ```
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const sizeStyles = {
    sm: { paddingVertical: 2, paddingHorizontal: 8, fontSize: 11 },
    md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12 },
    lg: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
  };

  return (
    <Box
      style={[
        styles.container,
        sizeStyles[size],
        {
          backgroundColor: config.bgColor,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize: sizeStyles[size].fontSize,
            color: config.color,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

StatusBadge.displayName = 'StatusBadge';
