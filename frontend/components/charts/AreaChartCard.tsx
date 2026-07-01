import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../ui/card';
import { VStack } from '../ui/vstack';
import { Heading } from '../ui/heading';
import { LineChart } from 'react-native-gifted-charts';

interface AreaChartCardProps {
  /**
   * Chart title
   */
  title: string;
  /**
   * Chart data points
   */
  data: Array<{ date: string; value: number }>;
  /**
   * Chart height
   */
  height?: number;
  /**
   * Gradient colors [start, end]
   */
  gradientColors?: [string, string];
}

/**
 * AreaChartCard - Area chart wrapped in card
 * 
 * @example
 * ```tsx
 * <AreaChartCard 
 *   title="Earnings Trend"
 *   data={earningsData}
 *   gradientColors={['#C9A227', 'transparent']}
 * />
 * ```
 */
export const AreaChartCard: React.FC<AreaChartCardProps> = ({
  title,
  data,
  height = 200,
  gradientColors = ['#C9A227', 'transparent'],
}) => {
  // Transform data for react-native-gifted-charts
  const chartData = data.map((item, index) => ({
    value: item.value,
    label: index % Math.ceil(data.length / 5) === 0 ? item.date : '', // Show every nth label
  }));

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10;

  return (
    <Card style={styles.card}>
      <VStack space="md">
        <Heading style={styles.title}>{title}</Heading>
        <View style={[styles.chartContainer, { height }]}>
          <LineChart
            data={chartData}
            height={height}
            width={300}
            color={gradientColors[0]}
            thickness={2}
            curved
            dataPointsColor={gradientColors[0]}
            dataPointsRadius={4}
            yAxisColor="#E5E7EB"
            xAxisColor="#E5E7EB"
            yAxisTextStyle={{ color: '#6B7280', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 10 }}
            maxValue={yAxisMax}
            spacing={40}
            initialSpacing={10}
            endSpacing={10}
            hideRules={false}
            rulesColor="#E5E7EB"
            rulesType="solid"
            yAxisLabelWidth={40}
            noOfSections={4}
            areaChart
            startFillColor={gradientColors[0]}
            endFillColor={gradientColors[1]}
            startOpacity={0.8}
            endOpacity={0.1}
          />
        </View>
      </VStack>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3A5F',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AreaChartCard.displayName = 'AreaChartCard';
