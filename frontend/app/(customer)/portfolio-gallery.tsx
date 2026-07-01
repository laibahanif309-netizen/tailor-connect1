import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from '../../components/ui/safe-area-view';
import { Text } from '../../components/ui/text';
import { ImageGrid, ImageModal } from '../../components/common';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { getPortfolioByTailorId } from '../../services/portfolio';
import type { PortfolioItem } from '../../types/portfolio';
import { useToast } from '../../utils/toast';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

function normalizeRouteParam(
  value: string | string[] | undefined
): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Portfolio Gallery Screen
 * Browse tailor's work samples in full gallery
 */
export default function PortfolioGalleryScreen() {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildPortfolioGalleryStyles(t), [t]);
  const params = useLocalSearchParams<{ tailorId: string }>();
  const tailorId = normalizeRouteParam(params.tailorId);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    loadPortfolio();
  }, [tailorId]);

  const loadPortfolio = async () => {
    if (!tailorId) {
      showError('Error', 'Tailor ID is required');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await getPortfolioByTailorId(tailorId);
      setPortfolio(response.portfolio);
    } catch (error: any) {
      console.error('Error loading portfolio:', error);
      showError('Error', error.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (imageId: string) => {
    const index = portfolio.findIndex((item) => item.id === imageId);
    if (index !== -1) {
      setSelectedImageIndex(index);
    }
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={t.gold} />
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (portfolio.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="image-off-outline"
            size={64}
            color={t.textMuted}
          />
          <Text style={styles.emptyText}>No portfolio images available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Image Grid */}
      <ImageGrid
        images={portfolio}
        columns={2}
        onImagePress={handleImagePress}
      />

      {/* Full Screen Image Modal */}
      {selectedImageIndex !== null && (
        <ImageModal
          visible={selectedImageIndex !== null}
          images={portfolio}
          initialIndex={selectedImageIndex}
          onClose={handleCloseModal}
        />
      )}
    </SafeAreaView>
  );
}

function buildPortfolioGalleryStyles(t: AppScreenTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.screenBg,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: t.textSecondary,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      color: t.textSecondary,
    },
  });
}
