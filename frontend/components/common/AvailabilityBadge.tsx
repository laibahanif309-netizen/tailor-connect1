import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack } from '../ui/hstack';
import { Box } from '../ui/box';
import { Text } from '../ui/text';

interface AvailabilityBadgeProps {
  /**
   * Whether the tailor is available
   */
  isAvailable: boolean;
  /**
   * Size variant
   */
  size?: 'sm' | 'md';
}

/**
 * AvailabilityBadge - Show tailor availability status
 * 
 * @example
 * ```tsx
 * <AvailabilityBadge isAvailable={true} />
 * ```
 */
export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  isAvailable,
  size = 'md',
}) => {
  const dotSize = size === 'sm' ? 6 : 8;
  const fontSize = size === 'sm' ? 12 : 14;
  const padding = size === 'sm' ? 6 : 8;

  return (
    <HStack space="xs" alignItems="center" style={styles.container}>
      {/* <Box
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: isAvailable ? '#10B981' : '#9CA3AF',
          },
        ]}
      /> */}
      <Text
        style={[
          styles.text,
          {
            fontSize,
            color: isAvailable ? '#10B981' : '#6B7280',
            textAlign: 'center',
            borderWidth: 1,
            borderColor: isAvailable ? '#10B981' : '#6B7280',
            paddingHorizontal: 8,
            paddingVertical: 1,
            borderRadius: 12,
            alignSelf: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {isAvailable ? 'Available' : 'Busy'}
      </Text>
    </HStack>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  dot: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
});

AvailabilityBadge.displayName = 'AvailabilityBadge';

