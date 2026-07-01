import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../ui/card';
import { VStack } from '../ui/vstack';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';
import { PieChart } from 'react-native-gifted-charts';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface DonutChartCardProps {
  /**
   * Chart title
   */
  title: string;
  /**
   * Chart data segments
   */
  data: Array<{ label: string; value: number; color: string }>;
  /**
   * Chart height
   */
  height?: number;
  /**
   * Optional center text (main number)
   */
  centerText?: string | number;
  /**
   * Optional subtitle text below main title
   */
  subtitle?: string;
  /**
   * Optional additional text below center number (e.g., change amount)
   */
  centerSubText?: string | number;
  /**
   * Optional second line below center number (e.g., percentage change)
   */
  centerSubText2?: string | number;
  /**
   * Optional icon name for top-right corner
   */
  titleIcon?: string;
  /**
   * Optional color for title icon
   */
  titleIconColor?: string;
}

/**
 * DonutChartCard - Donut chart wrapped in card with enhanced center content
 *
 * @example
 * ```tsx
 * <DonutChartCard
 *   title="Order Status"
 *   subtitle="All orders"
 *   data={statusData}
 *   centerText={totalOrders}
 *   centerSubText="+12"
 *   centerSubText2="+5.2%"
 *   titleIcon="chart-donut"
 * />
 * ```
 */
export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  data,
  height = 250,
  centerText,
  subtitle,
  centerSubText,
  centerSubText2,
  titleIcon,
  titleIconColor,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildDonutChartCardStyles(t), [t]);
  const resolvedTitleIconColor = titleIconColor ?? t.textMuted;

  const chartData = data.map((item) => ({
    value: item.value,
    color: item.color,
  }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card style={styles.card}>
      <VStack space="md">
        <View style={styles.titleSection}>
          <VStack space="xs" style={styles.titleContainer}>
            <Heading style={styles.title}>{title}</Heading>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </VStack>
          {titleIcon && (
            <View style={styles.titleIconContainer}>
              <MaterialCommunityIcons
                name={titleIcon as any}
                size={20}
                color={resolvedTitleIconColor}
              />
            </View>
          )}
        </View>

        <View style={[styles.chartContainer, { height }]}>
          <PieChart
            data={chartData}
            donut
            radius={80}
            innerRadius={50}
            innerCircleColor={t.cardBg}
            centerLabelComponent={() => {
              if (centerText !== undefined) {
                return (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerText}>
                      {typeof centerText === 'number'
                        ? centerText.toLocaleString()
                        : centerText}
                    </Text>
                    {centerSubText !== undefined && (
                      <Text style={styles.centerSubText}>
                        {typeof centerSubText === 'number'
                          ? centerSubText.toLocaleString()
                          : centerSubText}
                      </Text>
                    )}
                    {centerSubText2 !== undefined && (
                      <Text style={styles.centerSubText2}>
                        {typeof centerSubText2 === 'number'
                          ? centerSubText2.toLocaleString()
                          : centerSubText2}
                      </Text>
                    )}
                    {!centerSubText && !centerSubText2 && (
                      <Text style={styles.centerSubtext}>Total</Text>
                    )}
                  </View>
                );
              }
              return null;
            }}
          />
        </View>

        <VStack space="xs">
          {data.map((item, index) => (
            <View key={index} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendValue}>
                {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </Text>
            </View>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
};

function buildDonutChartCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    card: {
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    titleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: t.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    titleIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.menuIconBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerLabel: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerText: {
      fontSize: 32,
      fontWeight: '700',
      color: t.textPrimary,
      lineHeight: 38,
    },
    centerSubText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#10B981',
      marginTop: 4,
      lineHeight: 18,
    },
    centerSubText2: {
      fontSize: 12,
      fontWeight: '500',
      color: t.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    centerSubtext: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 4,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    legendLabel: {
      fontSize: 14,
      color: t.textPrimary,
      flex: 1,
      marginLeft: 4,
    },
    legendValue: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textSecondary,
    },
  });
}

DonutChartCard.displayName = 'DonutChartCard';
