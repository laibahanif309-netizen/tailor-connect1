import React from 'react';
import { StyleSheet } from 'react-native';
import { VStack } from '../ui/vstack';
import { Text } from '../ui/text';
import { StarRating } from './StarRating';

interface RatingFilterProps {
  /**
   * Minimum rating value (0-5)
   */
  minRating: number;
  /**
   * Callback when rating changes
   */
  onRatingChange: (rating: number) => void;
  /**
   * Label text
   */
  label?: string;
}

/**
 * RatingFilter - Star selector for minimum rating filter
 * 
 * @example
 * ```tsx
 * <RatingFilter 
 *   minRating={rating}
 *   onRatingChange={setRating}
 * />
 * ```
 */
export const RatingFilter: React.FC<RatingFilterProps> = ({
  minRating,
  onRatingChange,
  label = 'Minimum Rating',
}) => {
  return (
    <VStack space="sm">
      <Text style={styles.label}>{label}</Text>
      <VStack space="xs">
        <StarRating
          rating={minRating}
          interactive
          onRatingChange={onRatingChange}
          size={28}
        />
        {/* <Text style={styles.ratingText}>
          {minRating > 0 ? `${minRating} stars and above` : 'Any rating'}
        </Text> */}
      </VStack>
    </VStack>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3A5F',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

RatingFilter.displayName = 'RatingFilter';

