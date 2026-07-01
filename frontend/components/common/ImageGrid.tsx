import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, Pressable, TouchableOpacity, View, Text, Image } from 'react-native';
import { FlatList } from '../ui/flat-list';
import { Box } from '../ui/box';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { resolveMediaUrl } from '../../services/api';

interface ImageGridProps<T> {
  /**
   * Array of image objects
   */
  images: T[];
  /**
   * Number of columns (default: 2 or 3)
   */
  columns?: number;
  /**
   * Callback when image is pressed
   */
  onImagePress?: (imageId: string) => void;
  /**
   * Custom render function for items
   */
  renderItem?: (item: T, index: number) => React.ReactElement;
  /**
   * Key extractor function
   */
  keyExtractor?: (item: T, index: number) => string;
}

/**
 * ImageGrid - Grid layout for images (portfolio, fabrics)
 * 
 * @example
 * ```tsx
 * <ImageGrid 
 *   images={portfolioImages}
 *   columns={3}
 *   onImagePress={(id) => {}}
 * />
 * ```
 */
export const ImageGrid = <T extends { id: string; imageUrl: string }>({
  images,
  columns = 2,
  onImagePress,
  renderItem,
  keyExtractor,
}: ImageGridProps<T>) => {
  const ImageCard = ({ item }: { item: T }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const resolvedUri = resolveMediaUrl(item.imageUrl);

    useEffect(() => {
      setImageError(false);
      setImageLoading(true);
    }, [item.imageUrl]);

    return (
      <Pressable
        onPress={() => onImagePress?.(item.id)}
        style={styles.imageCard}
      >
        <Box style={styles.imageContainer}>
          {!imageError && resolvedUri ? (
            <Image
              source={{ uri: resolvedUri }}
              style={styles.image}
              resizeMode="cover"
              onError={() => {
                console.error('Image load error for:', item.imageUrl);
                setImageError(true);
                setImageLoading(false);
              }}
              onLoad={() => {
                setImageLoading(false);
              }}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-off" size={32} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>Failed to load</Text>
            </View>
          )}
          {imageLoading && !imageError && (
            <View style={styles.imageLoadingOverlay}>
              <MaterialCommunityIcons name="loading" size={24} color="#C9A227" />
            </View>
          )}
        </Box>
      </Pressable>
    );
  };

  const defaultRenderItem = ({ item, index }: { item: T; index: number }) => {
    if (renderItem) {
      return renderItem(item, index);
    }
    
    // Simple image card component
    return <ImageCard item={item} />;
  };

  const defaultKeyExtractor = (item: T, index: number) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    return item.id || `image-${index}`;
  };

  return (
    <FlatList
      data={images}
      renderItem={defaultRenderItem}
      keyExtractor={defaultKeyExtractor}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
  },
  imageCard: {
    width: '48%',
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    aspectRatio: 1,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

ImageGrid.displayName = 'ImageGrid';

