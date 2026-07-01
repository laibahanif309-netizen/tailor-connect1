import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallbackText } from '../ui/avatar';
import { Text } from '../ui/text';
import { Heading } from '../ui/heading';
import { HStack } from '../ui/hstack';
import { VStack } from '../ui/vstack';
import { StarRating } from './StarRating';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { resolveMediaUrl } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface ReviewCardProps {
  review: {
    id: string;
    customerName: string;
    customerAvatar?: string;
    rating: number;
    comment: string;
    createdAt: Date | string;
  };
  showHelpful?: boolean;
}

/**
 * ReviewCard - Display review with customer info, rating, and comment
 *
 * @example
 * ```tsx
 * <ReviewCard review={reviewData} />
 * ```
 */
export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showHelpful = false,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildReviewCardStyles(t), [t]);
  const formattedDate =
    typeof review.createdAt === 'string'
      ? format(new Date(review.createdAt), 'MMM dd, yyyy')
      : format(review.createdAt, 'MMM dd, yyyy');

  return (
    <Card style={styles.card}>
      <VStack space="md">
        <HStack space="md" style={styles.reviewHeader}>
          <Avatar size="md">
            {review.customerAvatar ? (
              <AvatarImage source={{ uri: resolveMediaUrl(review.customerAvatar) }} />
            ) : (
              <AvatarFallbackText>
                {review.customerName.substring(0, 2).toUpperCase()}
              </AvatarFallbackText>
            )}
          </Avatar>
          <VStack style={styles.nameBlock}>
            <Heading style={styles.customerName}>{review.customerName}</Heading>
            <Text style={styles.date}>{formattedDate}</Text>
          </VStack>
        </HStack>
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <StarRating rating={review.rating} size={16} />
          <Text style={styles.comment}>{review.comment}</Text>
        </View>
        {showHelpful && (
          <HStack space="sm" style={styles.helpfulRow}>
            <Text style={styles.helpfulText}>Helpful?</Text>
            <MaterialCommunityIcons name="thumb-up-outline" size={18} color={t.textSecondary} />
          </HStack>
        )}
      </VStack>
    </Card>
  );
};

function buildReviewCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    card: {
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    nameBlock: {
      flex: 1,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
    },
    date: {
      fontSize: 12,
      color: t.textMuted,
    },
    comment: {
      fontSize: 14,
      color: t.textPrimary,
      lineHeight: 20,
    },
    helpfulText: {
      fontSize: 12,
      color: t.textSecondary,
    },
    helpfulRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
}

ReviewCard.displayName = 'ReviewCard';
