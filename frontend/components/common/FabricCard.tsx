import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, Image as RNImage, View, ActivityIndicator } from 'react-native';
import { Card } from '../ui/card';
import { Text } from '../ui/text';
import { Heading } from '../ui/heading';
import { HStack } from '../ui/hstack';
import { VStack } from '../ui/vstack';
import { Box } from '../ui/box';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { resolveMediaUrl } from '../../services/api';

interface FabricCardProps {
  fabric: {
    id: string;
    name: string;
    imageUrl?: string;
    price: number;
    description?: string;
  };
  onPress?: (fabricId: string) => void;
  onEdit?: (fabricId: string) => void;
  onDelete?: (fabricId: string) => void;
  selectable?: boolean;
  selected?: boolean;
}

/**
 * FabricCard - Display fabric with image, name, and price
 * 
 * @example
 * ```tsx
 * <FabricCard 
 *   fabric={fabricData}
 *   onPress={(id) => {}}
 * />
 * ```
 */
export const FabricCard: React.FC<FabricCardProps> = ({
  fabric,
  onPress,
  onEdit,
  onDelete,
  selectable = false,
  selected = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const fabricUri = fabric.imageUrl ? resolveMediaUrl(fabric.imageUrl) : '';

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [fabric.imageUrl]);

  const handlePress = () => {
    if (onPress) {
      onPress(fabric.id);
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      <Card
        style={[
          styles.card,
          selectable && selected && styles.selectedCard,
        ]}
      >
        <VStack space="sm">
          {/* Image */}
          <Box style={styles.imageContainer}>
            {fabricUri && !imageError ? (
              <>
                <RNImage
                  source={{ uri: fabricUri }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => {
                    console.log('Fabric image failed to load:', fabricUri);
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  onLoad={() => {
                    setImageLoading(false);
                  }}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="small" color="#C9A227" />
                  </View>
                )}
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="image-off" size={32} color="#9CA3AF" />
              </View>
            )}
            {selectable && selected && (
              <Box style={styles.selectedOverlay}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color="#FFFFFF"
                />
              </Box>
            )}
            {(onEdit || onDelete) && (
              <HStack
                space="xs"
                style={[styles.actionButtons, { justifyContent: 'flex-end' }]}
              >
                {onEdit && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onEdit(fabric.id);
                    }}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete(fabric.id);
                    }}
                    style={[styles.actionButton, styles.deleteButton]}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
              </HStack>
            )}
          </Box>

          {/* Info */}
          <VStack space="xs">
            <Heading style={styles.name} numberOfLines={1}>
              {fabric.name}
            </Heading>
            {fabric.description && (
              <Text style={styles.description} numberOfLines={2}>
                {fabric.description}
              </Text>
            )}
            <Text style={styles.price}>
              PKR {fabric.price.toLocaleString('en-PK')}
            </Text>
          </VStack>
        </VStack>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 12,
  },
  card: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 160,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#C9A227',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(201, 162, 39, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 6,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3A5F',
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C9A227',
  },
});

FabricCard.displayName = 'FabricCard';

