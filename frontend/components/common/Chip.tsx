import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Box } from '../ui/box';
import { Text } from '../ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ChipProps {
  /**
   * Text content of the chip
   */
  label: string;
  /**
   * Whether the chip is selected
   */
  selected?: boolean;
  /**
   * Callback when chip is pressed
   */
  onPress?: () => void;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant
   */
  variant?: 'default' | 'outline' | 'filled';
  /**
   * Custom color (optional)
   */
  color?: string;
}

/**
 * Chip - Display tags/chips for specializations, filters, etc.
 * 
 * @example
 * ```tsx
 * <Chip label="Men's Wear" selected onPress={() => {}} />
 * ```
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  size = 'md',
  variant = 'default',
  color,
}) => {
  const sizeStyles = {
    sm: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 },
    md: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
    lg: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 16 },
  };

  const getVariantStyles = () => {
    const baseColor = color || '#C9A227';
    
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: selected ? baseColor : '#F3F4F6',
          borderColor: selected ? baseColor : '#E5E7EB',
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: selected ? baseColor : '#D1D5DB',
          borderWidth: 1.5,
        };
      default:
        return {
          backgroundColor: selected ? `${baseColor}20` : '#F3F4F6',
          borderColor: selected ? baseColor : 'transparent',
          borderWidth: 1,
        };
    }
  };

  const textColor = selected 
    ? (color || '#C9A227') 
    : (variant === 'filled' ? '#6B7280' : '#1D3A5F');

  const content = (
    <Box
      style={[
        styles.container,
        sizeStyles[size],
        getVariantStyles(),
      ]}
    >
      <Text
        style={[
          styles.label,
          { fontSize: sizeStyles[size].fontSize, color: textColor },
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </Box>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '500',
  },
  selectedLabel: {
    fontWeight: '600',
  },
});

Chip.displayName = 'Chip';
