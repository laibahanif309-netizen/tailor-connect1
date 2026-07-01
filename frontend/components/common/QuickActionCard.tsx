import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface QuickActionCardProps {
  /**
   * Icon name from MaterialCommunityIcons
   */
  icon: string;
  /**
   * Label text
   */
  label: string;
  /**
   * Callback when card is pressed
   */
  onPress: () => void;
}

/**
 * QuickActionCard - Card with icon and label for quick navigation
 *
 * @example
 * ```tsx
 * <QuickActionCard
 *   icon="clipboard-text"
 *   label="View Orders"
 *   onPress={() => router.push('/orders')}
 * />
 * ```
 */
export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  label,
  onPress,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildQuickActionCardStyles(t), [t]);

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Card style={styles.card}>
        <View style={styles.cardInner}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={icon as any} size={32} color={t.gold} />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
};

function buildQuickActionCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    pressable: {
      flex: 1,
      margin: 4,
    },
    card: {
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      minHeight: 100,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    cardInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    iconContainer: {
      position: 'relative',
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
      textAlign: 'center',
    },
  });
}

QuickActionCard.displayName = 'QuickActionCard';
