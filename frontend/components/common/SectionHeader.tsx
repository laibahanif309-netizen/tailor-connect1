import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { HStack } from '../ui/hstack';
import { VStack } from '../ui/vstack';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface SectionHeaderProps {
  /**
   * Section title
   */
  title: string;
  /**
   * Optional action label (e.g., "View All")
   */
  actionLabel?: string;
  /**
   * Optional action callback
   */
  onAction?: () => void;
  /**
   * Optional subtitle
   */
  subtitle?: string;
}

/**
 * SectionHeader - Reusable section header with title and optional action
 *
 * @example
 * ```tsx
 * <SectionHeader
 *   title="Portfolio"
 *   actionLabel="View All"
 *   onAction={() => router.push('/portfolio')}
 * />
 * ```
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  subtitle,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildSectionHeaderStyles(t), [t]);

  return (
    <HStack space="md" style={[styles.container, styles.headerRow]}>
      <VStack style={styles.titleBlock}>
        <Heading style={styles.title}>{title}</Heading>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </VStack>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={t.gold} />
        </TouchableOpacity>
      )}
    </HStack>
  );
};

function buildSectionHeaderStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    container: {
      marginBottom: 12,
      flexDirection: 'row',
    },
    headerRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    subtitle: {
      fontSize: 14,
      color: t.textSecondary,
      marginTop: 2,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: t.gold,
      marginRight: 4,
    },
  });
}

SectionHeader.displayName = 'SectionHeader';
