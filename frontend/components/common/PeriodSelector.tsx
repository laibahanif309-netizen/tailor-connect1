import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';

export type PeriodOption = '7d' | '30d';

interface PeriodSelectorProps {
  /**
   * Currently selected period
   */
  selectedPeriod: PeriodOption;
  /**
   * Callback when period changes
   */
  onPeriodChange: (period: PeriodOption) => void;
  /**
   * Optional custom period options (defaults to ['7d', '30d'])
   */
  options?: PeriodOption[];
}

/**
 * PeriodSelector - Tab-style period selector for charts
 * 
 * @example
 * ```tsx
 * <PeriodSelector 
 *   selectedPeriod="7d"
 *   onPeriodChange={(period) => setPeriod(period)}
 * />
 * ```
 */
export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  options = ['7d', '30d'],
}) => {
  const getPeriodLabel = (period: PeriodOption): string => {
    switch (period) {
      case '7d':
        return '7 Days';
      case '30d':
        return '30 Days';
      default:
        return period;
    }
  };

  return (
    <HStack space="sm" style={styles.container}>
      {options.map((period) => {
        const isSelected = period === selectedPeriod;
        return (
          <Pressable
            key={period}
            onPress={() => onPeriodChange(period)}
            style={[
              styles.tab,
              isSelected && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                isSelected && styles.tabTextActive,
              ]}
            >
              {getPeriodLabel(period)}
            </Text>
          </Pressable>
        );
      })}
    </HStack>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#C9A227',
    borderColor: '#C9A227',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

PeriodSelector.displayName = 'PeriodSelector';

