import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, ScrollView as RNScrollView, TouchableOpacity, View, Image as RNImage, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { ScrollView } from '../../components/ui/scroll-view';
import { VStack } from '../../components/ui/vstack';
import { HStack } from '../../components/ui/hstack';
import { Text } from '../../components/ui/text';
import { Heading } from '../../components/ui/heading';
import { Card } from '../../components/ui/card';
import { Box } from '../../components/ui/box';
import {
  StarRating,
  Chip,
  AvailabilityBadge,
  SectionHeader,
  FabricCard,
  ReviewCard,
  ActionButtonGroup,
  GradientButton,
} from '../../components/common';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { getTailorById } from '../../services/tailors';
import { fetchOrdersList } from '../../services/orders';
import { ensureConversationFromOrder } from '../../services/chat';
import type { TailorProfile } from '../../types/tailor';
import { useToast } from '../../utils/toast';
import { getErrorMessage, resolveMediaUrl } from '../../services/api';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

/**
 * Tailor Profile Screen
 * View tailor details, ratings, and availability
 */
function normalizeRouteParam(
  value: string | string[] | undefined
): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function TailorProfileScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildTailorProfileStyles(t), [t]);
  const params = useLocalSearchParams<{ id: string; orderId?: string }>();
  const tailorId = normalizeRouteParam(params.id);
  const orderIdFromRoute = normalizeRouteParam(params.orderId);
  const [tailor, setTailor] = useState<TailorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const openingChatRef = useRef(false);
  const { showError } = useToast();

  const loadTailorProfile = useCallback(async () => {
    if (!tailorId) return;

    try {
      setLoading(true);
      const data = await getTailorById(tailorId);
      if (data) {
        setTailor(data);
      } else {
        showError('Error', 'Tailor not found');
        router.back();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load tailor profile';
      showError('Error', message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [tailorId, showError]);

  useEffect(() => {
    if (!tailorId) return;
    loadTailorProfile();
  }, [tailorId, loadTailorProfile]);

  const handlePlaceOrder = () => {
    if (!tailorId) return;
    router.push(`/(customer)/place-order?tailorId=${encodeURIComponent(tailorId)}`);
  };

  const handleBookVisit = () => {
    if (!tailorId || !tailor) return;
    const q = new URLSearchParams();
    q.set('tailorId', tailorId);
    q.set('tailorName', tailor.businessName);
    router.push(`/(customer)/book-home-visit?${q.toString()}`);
  };

  const handleMessage = useCallback(async () => {
    if (!tailorId || !tailor || openingChatRef.current) return;
    openingChatRef.current = true;
    setOpeningChat(true);
    try {
      let orderId = orderIdFromRoute;
      if (!orderId) {
        const { orders } = await fetchOrdersList({ page: 1, limit: 50 });
        const forTailor = orders
          .filter((o) => o.tailorId === tailorId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        orderId = forTailor[0]?.id;
      }
      if (!orderId) {
        showError(
          'Message',
          'Place an order with this tailor first to start a conversation.'
        );
        return;
      }
      const conversationId = await ensureConversationFromOrder(orderId);
      const title = tailor.businessName || 'Tailor';
      router.push(`/(customer)/chat/${conversationId}?title=${encodeURIComponent(title)}`);
    } catch (e: unknown) {
      showError('Message', getErrorMessage(e));
    } finally {
      openingChatRef.current = false;
      setOpeningChat(false);
    }
  }, [tailorId, tailor, orderIdFromRoute, showError]);

  const handleCall = () => {
    const raw = tailor?.phone?.trim();
    if (!raw) {
      showError('Call', 'This tailor has not added a phone number yet.');
      return;
    }
    const tel = raw.replace(/[\s\-().]/g, '');
    if (!/\d/.test(tel)) {
      showError('Call', 'Invalid phone number on file.');
      return;
    }
    void Linking.openURL(`tel:${tel}`).catch(() =>
      showError('Call', 'Could not open the phone dialer.')
    );
  };

  const handleViewPortfolio = () => {
    if (tailorId) {
      router.push(`/(customer)/portfolio-gallery?tailorId=${tailorId}`);
    }
  };

  const handleViewAllReviews = () => {
    if (!tailorId || !tailor) return;
    const q = new URLSearchParams();
    q.set('tailorId', tailorId);
    q.set('title', `${tailor.businessName} — Reviews`);
    router.push(`/(customer)/reviews-list?${q.toString()}`);
  };

  const showViewAllReviews =
    tailor != null &&
    tailor.totalReviews > 0 &&
    (tailor.totalReviews > 3 || tailor.totalReviews > tailor.reviews.length);

  if (!tailorId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.missingIdWrap}>
          <Text style={styles.loadingText}>Tailor link is invalid or still opening.</Text>
          <GradientButton title="Go back" onPress={() => router.back()} height={44} borderRadius={22} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !tailor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <MaterialCommunityIcons name="loading" size={32} color={t.gold} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="lg" style={styles.container}>
          {/* Header Section */}
          <Card style={styles.headerCard}>
            <VStack space="md" style={{ alignItems: 'center' }}>
              <View style={styles.avatarWrapper}>
                {tailor.profileImage && !profileImageError ? (
                  <View style={styles.avatarImageContainer}>
                    <RNImage
                      source={{ uri: resolveMediaUrl(tailor.profileImage) }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onError={() => {
                        console.log('Profile image failed to load:', tailor.profileImage);
                        setProfileImageError(true);
                      }}
                      onLoad={() => {
                        console.log('Profile image loaded successfully');
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.avatarFallbackContainer}>
                    <Text style={styles.avatarFallbackText}>
                      {tailor.businessName.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <VStack space="xs" style={{ alignItems: 'center' }}>
                <Heading style={styles.businessName}>
                  {tailor.businessName}
                </Heading>
                <HStack space="xs" style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color={t.textSecondary}
                    />
                  <Text style={styles.location}>{tailor.location}</Text>
                </HStack>
                <StarRating
                  rating={tailor.rating}
                  size={20}
                  showRatingNumber
                  totalReviews={tailor.totalReviews}
                />
                <View>

                <AvailabilityBadge isAvailable={tailor.isAvailable}  />
                </View>
              </VStack>
            </VStack>
          </Card>

          {/* About Section */}
          <Card style={styles.sectionCard}>
            <VStack style={{gap: 16}}>
              <Heading style={styles.sectionTitle}>About</Heading>
              {tailor.description && (
                <Text style={styles.description}>{tailor.description}</Text>
              )}
              <VStack space="sm">
                <Text style={styles.label}>Specializations</Text>
                <HStack space="xs" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {tailor.specializations.map((spec, index) => (
                    <Chip key={index} label={spec} size="sm" />
                  ))}
                </HStack>
              </VStack>
              <Text style={styles.experience}>
                {tailor.experience} years of experience
              </Text>
            </VStack>
          </Card>

          {/* Portfolio Preview */}
          {tailor.portfolio.length > 0 && (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title="Portfolio"
                actionLabel="View All"
                onAction={handleViewPortfolio}
              />
              <RNScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.portfolioScroll}
              >
                {tailor.portfolio.slice(0, 4).map((item) => (
                  <PortfolioImageItem
                    key={item.id}
                    imageUrl={item.imageUrl}
                    onPress={handleViewPortfolio}
                    styles={styles}
                    theme={t}
                  />
                ))}
              </RNScrollView>
            </Card>
          )}

          {/* Fabrics Section */}
          {tailor.fabrics.length > 0 && (
            <Card style={styles.sectionCard}>
              <SectionHeader title="Available Fabrics" />
              <RNScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fabricsScroll}
              >
                {tailor.fabrics.map((fabric) => (
                  <FabricCard
                    key={fabric.id}
                    fabric={fabric}
                    onPress={() =>
                      router.push(
                        `/(customer)/place-order?tailorId=${encodeURIComponent(tailorId!)}&fabricId=${encodeURIComponent(fabric.id)}`
                      )
                    }
                  />
                ))}
              </RNScrollView>
            </Card>
          )}

          {/* Reviews Section */}
          {tailor.reviews.length > 0 && (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title="Reviews"
                actionLabel={showViewAllReviews ? 'View all' : undefined}
                onAction={showViewAllReviews ? handleViewAllReviews : undefined}
              />
              <VStack space="sm" style={{justifyContent: 'center'}}>
                {tailor.reviews.slice(0, 3).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </VStack>
            </Card>
          )}

          {/* Action Buttons */}
          <VStack space="sm" style={styles.actions}>
            {/* Place Order Button - Separate */}
            <GradientButton
              title="Place Order"
              onPress={handlePlaceOrder}
              height={48}
              borderRadius={24}
            />
            
            {/* Other Action Buttons */}
            <ActionButtonGroup
              actions={[
                {
                  label: 'Home Visit',
                  icon: 'calendar-outline',
                  onPress: handleBookVisit,
                  variant: 'outline',
                },
                {
                  label: 'Message',
                  icon: 'message-text-outline',
                  onPress: handleMessage,
                  variant: 'outline',
                },
                {
                  label: 'Call',
                  icon: 'phone-outline',
                  onPress: handleCall,
                  variant: 'outline',
                },
              ]}
              layout="horizontal"
            />
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

type TailorProfileStyles = ReturnType<typeof buildTailorProfileStyles>;

// Portfolio Image Item Component with Error Handling
const PortfolioImageItem: React.FC<{
  imageUrl: string;
  onPress: () => void;
  styles: TailorProfileStyles;
  theme: AppScreenTheme;
}> = ({
  imageUrl,
  onPress,
  styles,
  theme,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const resolvedUri = resolveMediaUrl(imageUrl);

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [imageUrl]);

  return (
    <TouchableOpacity onPress={onPress} style={styles.portfolioItem}>
      <Card style={styles.portfolioImageCard}>
        <Box style={styles.portfolioImageContainer}>
          {!imageError && resolvedUri ? (
            <>
              <RNImage
                source={{ uri: resolvedUri }}
                style={styles.portfolioImage}
                resizeMode="cover"
                onError={() => {
                  console.log('Portfolio image failed to load:', imageUrl);
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => {
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={theme.gold} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-off" size={32} color={theme.textMuted} />
            </View>
          )}
        </Box>
      </Card>
    </TouchableOpacity>
  );
};

function buildTailorProfileStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    container: {
      padding: 16,
      gap: 16,
    },
    loadingCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: t.textSecondary,
    },
    missingIdWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 16,
    },
    headerCard: {
      padding: 24,
      backgroundColor: t.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    avatarWrapper: {
      width: 128,
      height: 128,
      borderRadius: 64,
      overflow: 'hidden',
      backgroundColor: t.gold,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImageContainer: {
      width: '100%',
      height: '100%',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarFallbackContainer: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.gold,
    },
    avatarFallbackText: {
      fontSize: 48,
      fontWeight: '700',
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    businessName: {
      fontSize: 24,
      fontWeight: '700',
      color: t.textPrimary,
      textAlign: 'center',
    },
    location: {
      fontSize: 14,
      color: t.textSecondary,
    },
    sectionCard: {
      padding: 16,
      backgroundColor: t.cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.cardBorder,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: t.textPrimary,
    },
    description: {
      fontSize: 14,
      color: t.textPrimary,
      lineHeight: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 4,
    },
    experience: {
      fontSize: 14,
      color: t.textSecondary,
      fontStyle: 'italic',
    },
    portfolioScroll: {
      paddingVertical: 8,
    },
    portfolioItem: {
      marginRight: 12,
    },
    portfolioImageCard: {
      width: 140,
      height: 140,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: t.divider,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    portfolioImageContainer: {
      width: 140,
      height: 140,
      position: 'relative',
    },
    portfolioImage: {
      width: 140,
      height: 140,
    },
    imageLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholder: {
      width: 140,
      height: 140,
      backgroundColor: t.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabricsScroll: {
      paddingVertical: 8,
    },
    actions: {
      marginTop: 8,
      gap: 14,
    },
  });
}
