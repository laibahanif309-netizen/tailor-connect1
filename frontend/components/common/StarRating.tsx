import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface StarRatingProps {
  /**
   * Current rating value (0-5)
   */
  rating: number;
  /**
   * Whether the rating is interactive (can be changed by user)
   */
  interactive?: boolean;
  /**
   * Callback when rating changes (only used when interactive is true)
   */
  onRatingChange?: (rating: number) => void;
  /**
   * Size of the stars
   */
  size?: number;
  /**
   * Whether to show the rating number next to stars
   */
  showRatingNumber?: boolean;
  /**
   * Total number of reviews (shows "4.5 (120 reviews)")
   */
  totalReviews?: number;
}

/**
 * StarRating - Display and optionally edit star ratings (0-5 stars)
 * 
 * @example
 * ```tsx
 * <StarRating rating={4.5} showRatingNumber totalReviews={120} />
 * ```
 * 
 * @example
 * ```tsx
 * <StarRating 
 *   rating={rating} 
 *   interactive 
 *   onRatingChange={setRating} 
 * />
 * ```
 */
export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  interactive = false,
  onRatingChange,
  size = 20,
  showRatingNumber = false,
  totalReviews,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildStarRatingStyles(t), [t]);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const handleStarPress = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => {
        let iconName: string;
        let iconColor: string;

        if (index < fullStars) {
          iconName = 'star';
          iconColor = '#C9A227';
        } else if (index === fullStars && hasHalfStar) {
          iconName = 'star-half-full';
          iconColor = '#C9A227';
        } else {
          iconName = 'star-outline';
          iconColor = t.isDark ? '#64748B' : '#D1D5DB';
        }

        return (
          <Pressable
            key={index}
            onPress={() => handleStarPress(index)}
            disabled={!interactive}
            style={[interactive ? styles.interactiveStar : undefined, styles.star]}
          >
            <MaterialCommunityIcons
              name={iconName as any}
              size={size}
              color={iconColor}
            />
          </Pressable>
        );
      })}
      
      {showRatingNumber && (
        <Text style={[styles.ratingText, { fontSize: size * 0.7 }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      
      {totalReviews !== undefined && (
        <Text style={[styles.reviewsText, { fontSize: size * 0.6 }]}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </Text>
      )}
    </View>
  );
};

function buildStarRatingStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    star: {
      marginRight: 2,
    },
    interactiveStar: {
      padding: 2,
    },
    ratingText: {
      color: t.textPrimary,
      fontWeight: '600',
      marginLeft: 4,
    },
    reviewsText: {
      color: t.textSecondary,
      marginLeft: 4,
    },
  });
}

StarRating.displayName = 'StarRating';
