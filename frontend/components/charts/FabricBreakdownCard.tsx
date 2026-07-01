import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../ui/card';
import { VStack } from '../ui/vstack';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';
import type { FabricBreakdownItem } from '../../types/dashboard';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

type Props = {
  title: string;
  subtitle?: string;
  items: FabricBreakdownItem[];
};

/**
 * Horizontal bars for fabric (category) share of orders in the selected period.
 */
export function FabricBreakdownCard({ title, subtitle, items }: Props) {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildStyles(t), [t]);
  const max = useMemo(() => Math.max(1, ...items.map((i) => i.count)), [items]);

  if (items.length === 0) {
    return (
      <Card style={styles.card}>
        <VStack space="sm">
          <Heading style={styles.title}>{title}</Heading>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.empty}>No fabric data in this period</Text>
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
        <VStack space="sm">
          {items.map((row) => (
            <View key={row.fabricId ?? row.name} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.name} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.meta}>
                  {row.count} ({row.percentage}%)
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: t.menuIconBg }]}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${(row.count / max) * 100}%`,
                      backgroundColor: t.gold,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </VStack>
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
      paddingVertical: 8,
    },
    row: {
      marginBottom: 4,
    },
    rowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: t.textPrimary,
      marginRight: 8,
    },
    meta: {
      fontSize: 12,
      color: t.textMuted,
    },
    track: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 4,
    },
  });
}

FabricBreakdownCard.displayName = 'FabricBreakdownCard';
