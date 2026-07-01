import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Box } from '../ui/box';
import { Text } from '../ui/text';
import { Image } from '../ui/image';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetItem, ActionsheetItemText } from '../ui/actionsheet';
import { useImagePicker } from '../../hooks/useImagePicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ImagePickerButtonProps {
  /**
   * Preview current image URI
   */
  imageUri?: string | null;
  /**
   * Callback when image is selected
   */
  onImageSelected: (uri: string) => void;
  /**
   * Label text
   */
  label?: string;
  /**
   * Whether to show as circular (for profile images)
   */
  circular?: boolean;
  /**
   * Size of the image/button
   */
  size?: number;
  /**
   * Aspect ratio for editing
   */
  aspectRatio?: [number, number];
}

/**
 * ImagePickerButton - Button to pick image from gallery or camera
 * 
 * @example
 * ```tsx
 * <ImagePickerButton 
 *   imageUri={profileImage}
 *   onImageSelected={(uri) => setProfileImage(uri)}
 *   circular
 *   size={100}
 * />
 * ```
 */
export const ImagePickerButton: React.FC<ImagePickerButtonProps> = ({
  imageUri,
  onImageSelected,
  label,
  circular = false,
  size = 100,
  aspectRatio = [1, 1],
}) => {
  const [showActionsheet, setShowActionsheet] = useState(false);

  const handlePress = () => {
    setShowActionsheet(true);
  };

  const imagePicker = useImagePicker({
    allowsEditing: true,
    aspect: aspectRatio,
  });

  const handleSelectOption = async (option: 'camera' | 'gallery') => {
    setShowActionsheet(false);
    
    let uri: string | null = null;
    if (option === 'camera') {
      uri = await imagePicker.takePhoto();
    } else {
      uri = await imagePicker.pickFromGallery();
    }

    if (uri) {
      onImageSelected(uri);
    }
  };

  return (
    <>
      <Pressable onPress={handlePress} disabled={imagePicker.isPicking} style={styles.container}>
        <Box
          style={[
            styles.imageContainer,
            {
              width: size,
              height: size,
              borderRadius: circular ? size / 2 : 8,
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: size,
                  height: size,
                  borderRadius: circular ? size / 2 : 8,
                },
              ]}
              resizeMode="cover"
            />
          ) : (
            <Box
              style={[
                styles.placeholder,
                {
                  width: size,
                  height: size,
                  borderRadius: circular ? size / 2 : 8,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="camera-plus"
                size={size * 0.4}
                color="#C9A227"
              />
            </Box>
          )}
          <Box style={styles.overlay}>
            <MaterialCommunityIcons
              name="camera"
              size={20}
              color="#FFFFFF"
            />
          </Box>
        </Box>
        {label && <Text style={styles.label}>{label}</Text>}
      </Pressable>

      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetItem onPress={() => handleSelectOption('camera')}>
            <MaterialCommunityIcons name="camera" size={24} color="#1D3A5F" />
            <ActionsheetItemText>Take Photo</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => handleSelectOption('gallery')}>
            <MaterialCommunityIcons name="image" size={24} color="#1D3A5F" />
            <ActionsheetItemText>Choose from Gallery</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    color: '#1D3A5F',
    fontWeight: '500',
  },
});

ImagePickerButton.displayName = 'ImagePickerButton';
