import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/text';

interface GradientButtonProps {
  /**
   * Button text to display
   */
  title: string;
  /**
   * Callback function when button is pressed
   */
  onPress: () => void;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Whether the button is in loading state
   */
  isLoading?: boolean;
  /**
   * Custom gradient colors array (default: gold/yellow gradient)
   * Must have at least 2 colors
   */
  colors?: readonly [string, string, ...string[]];
  /**
   * Custom width for the button (default: '100%')
   */
  width?: DimensionValue;
  /**
   * Custom height for the button (default: 52)
   */
  height?: number;
  /**
   * Custom border radius (default: 25)
   */
  borderRadius?: number;
  /**
   * Custom text style
   */
  textStyle?: TextStyle;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Loading text to display when isLoading is true
   */
  loadingText?: string;
}

/**
 * GradientButton - A custom button component with gradient background
 * 
 * This component provides a beautiful gradient button design with:
 * - Gold/yellow gradient background (customizable)
 * - Rounded corners
 * - White, bold text
 * - Loading state support
 * - Shadow effects
 * 
 * @example
 * ```tsx
 * <GradientButton
 *   title="Login"
 *   onPress={handleLogin}
 *   isLoading={isSubmitting}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * // Custom gradient colors
 * <GradientButton
 *   title="Sign Up"
 *   onPress={handleSignUp}
 *   colors={['#FF6B6B', '#EE5A6F', '#C44569']}
 * />
 * ```
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
  isLoading = false,
  colors = ['#D4AF37', '#C9A227', '#A88B1E'] as const,
  width = '100%',
  height = 52,
  borderRadius = 25,
  textStyle,
  style,
  loadingText,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          width,
          borderRadius,
          shadowColor: colors[1] || '#C9A227',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            height,
            borderRadius,
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
            },
            textStyle,
          ]}
        >
          {isLoading ? loadingText || title : title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
  },
});

GradientButton.displayName = 'GradientButton';

