import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Heading } from '../ui/heading';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface StatCardProps {
  /**
   * Main number/value to display
   */
  value: string | number;
  /**
   * Label/title text at the top
   */
  label: string;
  /**
   * Icon name from MaterialCommunityIcons
   */
  icon: string;
  /**
   * Icon color (defaults to theme accent for list icons)
   */
  iconColor?: string;
  /**
   * Secondary detail text (optional, shown below value)
   */
  subLabel?: string;
  /**
   * Icon size (defaults to 24)
   */
  iconSize?: number;
}

/**
 * StatCard - Display statistics with icon, value, and label
 * 
 * @example
 * ```tsx
 * <StatCard 
 *   value={150}
 *   label="Total Orders"
 *   icon="clipboard-text"
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  iconColor,
  subLabel,
  iconSize = 24,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildStatCardStyles(t), [t]);
  const iconTint = iconColor ?? t.menuIcon;
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Label at top */}
        <Text style={styles.label}>{label}</Text>
        
        {/* Value and Icon Row */}
        <View style={styles.valueRow}>
          <View style={styles.valueContainer}>
            <Heading style={styles.value} numberOfLines={2}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Heading>
          </View>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon as any}
              size={iconSize}
              color={iconTint}
            />
          </View>
        </View>
        
        {/* Sublabel if provided */}
        {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      </View>
    </View>
  );
};

function buildStatCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      height: 140,
    },
    card: {
      flex: 1,
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      borderWidth: t.isDark ? 1 : 0,
      borderColor: t.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: t.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    valueContainer: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    value: {
      fontSize: 20,
      fontWeight: '700',
      color: t.textPrimary,
      lineHeight: 28,
      flexShrink: 1,
    },
    subLabel: {
      fontSize: 11,
      color: t.textMuted,
      marginTop: 6,
      fontWeight: '500',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.menuIconBg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
}

StatCard.displayName = 'StatCard';
