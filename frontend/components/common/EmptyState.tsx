import React from 'react';
import { StyleSheet } from 'react-native';
import { VStack } from '../ui/vstack';
import { Text } from '../ui/text';
import { Heading } from '../ui/heading';
import { Button, ButtonText } from '../ui/button';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  /**
   * Icon name from MaterialCommunityIcons
   */
  icon: string;
  /**
   * Main title text
   */
  title: string;
  /**
   * Subtitle/description text
   */
  subtitle?: string;
  /**
   * Custom icon color
   */
  iconColor?: string;
  /**
   * Optional action button label
   */
  actionLabel?: string;
  /**
   * Optional action button callback
   */
  onAction?: () => void;
}

/**
 * EmptyState - Show empty state when no data available
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   icon="account-search-outline"
 *   title="No tailors found"
 *   subtitle="Try adjusting your search criteria"
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  iconColor = '#9CA3AF',
  actionLabel,
  onAction,
}) => {
  return (
    <VStack space="md" alignItems="center" style={styles.container}>
      <MaterialCommunityIcons
        name={icon as any}
        size={64}
        color={iconColor}
      />
      <VStack space="xs" alignItems="center">
        <Heading style={styles.title}>{title}</Heading>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </VStack>
      {actionLabel && onAction && (
        <Button
          onPress={onAction}
          variant="outline"
          style={styles.actionButton}
        >
          <ButtonText>{actionLabel}</ButtonText>
        </Button>
      )}
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D3A5F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 8,
  },
});

EmptyState.displayName = 'EmptyState';
