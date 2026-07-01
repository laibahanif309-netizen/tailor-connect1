import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';

interface CharacterCounterProps {
  /**
   * Current character count
   */
  current: number;
  /**
   * Maximum character count
   */
  max: number;
  /**
   * Whether to show warning at 80% (default: true)
   */
  showWarning?: boolean;
}

/**
 * CharacterCounter - Show character count for textarea inputs
 * 
 * @example
 * ```tsx
 * <CharacterCounter current={text.length} max={500} />
 * ```
 */
export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max,
  showWarning = true,
}) => {
  const percentage = (current / max) * 100;
  const isWarning = showWarning && percentage >= 80;
  const isError = current > max;

  const textColor = isError
    ? '#EF4444'
    : isWarning
    ? '#F59E0B'
    : '#6B7280';

  return (
    <HStack justifyContent="flex-end">
      <Text style={[styles.counter, { color: textColor }]}>
        {current} / {max}
      </Text>
    </HStack>
  );
};

const styles = StyleSheet.create({
  counter: {
    fontSize: 12,
    fontWeight: '500',
  },
});

CharacterCounter.displayName = 'CharacterCounter';

