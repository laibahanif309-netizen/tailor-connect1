import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Card } from '../ui/card';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';
import { StarRating } from './StarRating';
import { AvailabilityBadge } from './AvailabilityBadge';
import { router } from 'expo-router';
import { resolveMediaUrl } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface TailorCardProps {
  tailor: {
    id: string;
    businessName: string;
    location: string;
    rating: number;
    profileImage?: string;
    specializations: string[];
    isAvailable: boolean;
    totalReviews?: number;
  };
  onPress?: (tailorId: string) => void;
}

/**
 * TailorCard - Display tailor information in LinkedIn-style grid card
 * 
 * @example
 * ```tsx
 * <TailorCard 
 *   tailor={tailorData}
 *   onPress={(id) => router.push(`/tailor/${id}`)}
 * />
 * ```
 */
export const TailorCard: React.FC<TailorCardProps> = ({
  tailor,
  onPress,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorCardStyles(t), [t]);
  const handlePress = () => {
    if (onPress) {
      onPress(tailor.id);
    }
  };

  const handleViewPortfolio = (e: any) => {
    e.stopPropagation();
    router.push(`/(customer)/portfolio-gallery?tailorId=${tailor.id}`);
  };

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      <View style={styles.cardWrapper}>
        <Card style={styles.card}>
          <VStack space="sm" style={styles.contentContainer}>
            {/* Rounded Profile Image at Top */}
            <View style={styles.imageContainer}>
              {tailor.profileImage ? (
                <Image
                  source={{ uri: resolveMediaUrl(tailor.profileImage) }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>
                    {tailor.businessName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Centered Content Section */}
            <VStack space="xs" style={styles.content}>
              {/* Business Name - Centered */}
              <Heading style={styles.businessName} numberOfLines={1}>
                {tailor.businessName}
              </Heading>

              {/* Availability Badge - Centered */}
              <AvailabilityBadge isAvailable={tailor.isAvailable} size="sm" />

              {/* Rating and Reviews - Centered */}
              <View style={styles.ratingContainer}>
                <StarRating
                  rating={tailor.rating}
                  size={12}
                  showRatingNumber
                  totalReviews={tailor.totalReviews}
                />
              </View>

              {/* View Portfolio Button - Centered */}
              <TouchableOpacity
                onPress={handleViewPortfolio}
                style={styles.portfolioButton}
                activeOpacity={0.7}
              >
                <Text style={styles.portfolioButtonText}>View Portfolio</Text>
              </TouchableOpacity>
            </VStack>
          </VStack>
        </Card>
      </View>
    </Pressable>
  );
};

function buildTailorCardStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    pressable: {
      width: '48%',
      margin: 6,
    },
    cardWrapper: {
      width: '100%',
      backgroundColor: t.cardBg,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: t.cardBorder,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: t.isDark ? 0.35 : 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    card: {
      width: '100%',
      padding: 0,
      backgroundColor: 'transparent',
    },
    contentContainer: {
      paddingTop: 20,
      paddingBottom: 16,
      alignItems: 'center',
    },
    imageContainer: {
      marginBottom: 1,
      alignItems: 'center',
    },
    profileImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.menuIconBg,
    },
    profileImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: t.menuIconBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholderText: {
      fontSize: 24,
      fontWeight: '700',
      color: t.textMuted,
    },
    content: {
      width: '100%',
      paddingHorizontal: 12,
    },
    businessName: {
      fontSize: 16,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 4,
    },
    ratingContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },
    portfolioButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: t.menuIconBg,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    portfolioButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: t.textPrimary,
    },
  });
}

TailorCard.displayName = 'TailorCard';

