/**
 * Custom hook for image picker functionality
 * Handles permissions and image selection from camera/gallery
 */

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

interface UseImagePickerOptions {
  /**
   * Whether to allow editing the image
   */
  allowsEditing?: boolean;
  /**
   * Aspect ratio for editing (e.g., [1, 1] for square)
   */
  aspect?: [number, number];
  /**
   * Quality of the image (0-1)
   */
  quality?: number;
}

interface UseImagePickerReturn {
  /**
   * Selected image URI
   */
  imageUri: string | null;
  /**
   * Whether picker is currently processing
   */
  isPicking: boolean;
  /**
   * Pick image from gallery
   */
  pickFromGallery: () => Promise<string | null>;
  /**
   * Take photo with camera
   */
  takePhoto: () => Promise<string | null>;
  /**
   * Show action sheet to choose between camera/gallery
   */
  showImagePicker: () => Promise<string | null>;
  /**
   * Clear selected image
   */
  clearImage: () => void;
}

/**
 * useImagePicker - Hook for handling image selection
 * 
 * @example
 * ```tsx
 * const { imageUri, showImagePicker, clearImage } = useImagePicker({
 *   allowsEditing: true,
 *   aspect: [1, 1],
 * });
 * ```
 */
export const useImagePicker = (
  options: UseImagePickerOptions = {}
): UseImagePickerReturn => {
  const { allowsEditing = true, aspect, quality = 0.8 } = options;
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select images.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  /**
   * Pick image from gallery
   */
  const pickFromGallery = async (): Promise<string | null> => {
    try {
      setIsPicking(true);

      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        return uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      return null;
    } finally {
      setIsPicking(false);
    }
  };

  /**
   * Take photo with camera
   */
  const takePhoto = async (): Promise<string | null> => {
    try {
      setIsPicking(true);

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        return uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    } finally {
      setIsPicking(false);
    }
  };

  /**
   * Show action sheet to choose between camera/gallery
   */
  const showImagePicker = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const uri = await takePhoto();
              resolve(uri);
            },
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const uri = await pickFromGallery();
              resolve(uri);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true }
      );
    });
  };

  /**
   * Clear selected image
   */
  const clearImage = () => {
    setImageUri(null);
  };

  return {
    imageUri,
    isPicking,
    pickFromGallery,
    takePhoto,
    showImagePicker,
    clearImage,
  };
};

