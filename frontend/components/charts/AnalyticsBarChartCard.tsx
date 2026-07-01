import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '../ui/card';
import { VStack } from '../ui/vstack';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';
import type { ChartDataPoint } from '../../types/dashboard';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

type Props = {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  /** Bar fill color */
  barColor?: string;
  /** Unused; reserved for tooltips */
  valueUnit?: string;
};

/**
 * Scrollable bar chart for order / revenue time series (gifted-charts).
 */
export function AnalyticsBarChartCard({
  title,
  subtitle,
  data,
  barColor,
  valueUnit = '',
}: Props) {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildStyles(t), [t]);
  const { width: winW } = useWindowDimensions();
  const chartWidth = Math.max(winW - 48, 280);

  const barData = useMemo(
    () =>
      data.map((p) => ({
        value: p.value,
        label: p.label,
        frontColor: barColor ?? t.gold,
      })),
    [data, barColor, t.gold]
  );

  const maxVal = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => d.value));
    return Math.ceil(m * 1.15);
  }, [data]);

  if (data.length === 0) {
    return (
      <Card style={styles.card}>
        <VStack space="sm">
          <Heading style={styles.title}>{title}</Heading>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.empty}>No data in this period</Text>
        </VStack>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <VStack space="md">
        <View>
          <Heading style={styles.title}>{title}</Heading>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={barData}
            width={Math.max(chartWidth, data.length * 36)}
            height={200}
            barWidth={22}
            spacing={12}
            roundedTop
            roundedBottom
            hideRules={false}
            xAxisThickness={1}
            yAxisThickness={0}
            xAxisColor={t.cardBorder}
            yAxisColor={t.cardBorder}
            rulesColor={t.isDark ? '#334155' : '#E5E7EB'}
            rulesType="solid"
            yAxisTextStyle={{ color: t.textMuted, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: t.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={maxVal}
            yAxisLabelWidth={32}
            backgroundColor="transparent"
          />
        </ScrollView>
      </VStack>
    </Card>
  );
}

function buildStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    card: {
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      color: t.textSecondary,
      marginTop: 2,
    },
    empty: {
      fontSize: 14,
      color: t.textMuted,
      paddingVertical: 16,
    },
  });
}

AnalyticsBarChartCard.displayName = 'AnalyticsBarChartCard';
