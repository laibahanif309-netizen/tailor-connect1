import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, View, Image, Modal as RNModal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { resolveMediaUrl } from '../../services/api';

interface ImageModalProps {
  /**
   * Whether modal is visible
   */
  visible: boolean;
  /**
   * Array of images to display
   */
  images: Array<{ id: string; imageUrl: string }>;
  /**
   * Initial image index
   */
  initialIndex?: number;
  /**
   * Callback when modal is closed
   */
  onClose: () => void;
}

/**
 * ImageModal - Full-screen image viewer with zoom and swipe
 * 
 * @example
 * ```tsx
 * <ImageModal 
 *   visible={showModal}
 *   images={portfolioImages}
 *   initialIndex={0}
 *   onClose={() => setShowModal(false)}
 * />
 * ```
 */
export const ImageModal: React.FC<ImageModalProps> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Update currentIndex when initialIndex changes
  useEffect(() => {
    if (visible && initialIndex >= 0 && initialIndex < images.length) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex, images.length]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!visible || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Close Button */}
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Image */}
        <Image
          source={{ uri: resolveMediaUrl(currentImage.imageUrl) }}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              disabled={currentIndex === 0}
              style={[
                styles.navButton,
                currentIndex === 0 && styles.navButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={32}
                color={currentIndex === 0 ? '#9CA3AF' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <View style={styles.indicator}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.dotActive,
                    index > 0 && styles.dotSpacing,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleNext}
              disabled={currentIndex === images.length - 1}
              style={[
                styles.navButton,
                currentIndex === images.length - 1 && styles.navButtonDisabled,
              ]}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={32}
                color={currentIndex === images.length - 1 ? '#9CA3AF' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  image: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  navigation: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotSpacing: {
    marginLeft: 6,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

ImageModal.displayName = 'ImageModal';

