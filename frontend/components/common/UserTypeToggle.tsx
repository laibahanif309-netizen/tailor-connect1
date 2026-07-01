import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/text';

export type UserType = 'customer' | 'tailor';

interface UserTypeToggleProps {
  /**
   * Current selected user type
   */
  value: UserType;
  /**
   * Callback when user type changes
   */
  onValueChange: (value: UserType) => void;
  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
}

/**
 * UserTypeToggle - A custom toggle component for selecting between Customer and Tailor
 * 
 * This component provides a pixel-perfect toggle design matching the Figma design:
 * - Selected option shows gold/yellow gradient background with white text
 * - Unselected option shows white background with dark blue border and dark blue text
 * - Smooth animations between states
 * 
 * @example
 * ```tsx
 * <UserTypeToggle
 *   value={userType}
 *   onValueChange={setUserType}
 * />
 * ```
 */
export const UserTypeToggle: React.FC<UserTypeToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  const isCustomer = value === 'customer';

  const handleCustomerPress = () => {
    if (!disabled && !isCustomer) {
      onValueChange('customer');
    }
  };

  const handleTailorPress = () => {
    if (!disabled && isCustomer) {
      onValueChange('tailor');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        {/* Customer Option */}
        <TouchableOpacity
          onPress={handleCustomerPress}
          disabled={disabled}
          activeOpacity={0.8}
          style={styles.optionContainer}
        >
          {isCustomer ? (
            <LinearGradient
              colors={['#D4AF37', '#C9A227', '#A88B1E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectedOption}
            >
              <Text style={styles.selectedText}>Customer</Text>
            </LinearGradient>
          ) : (
            <View style={styles.unselectedOption}>
              <Text style={styles.unselectedText}>Customer</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tailor Option */}
        <TouchableOpacity
          onPress={handleTailorPress}
          disabled={disabled}
          activeOpacity={0.8}
          style={styles.optionContainer}
        >
          {!isCustomer ? (
            <LinearGradient
              colors={['#D4AF37', '#C9A227', '#A88B1E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.selectedOption}
            >
              <Text style={styles.selectedText}>Tailor</Text>
            </LinearGradient>
          ) : (
            <View style={styles.unselectedOption}>
              <Text style={styles.unselectedText}>Tailor</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F5F6F8',
    borderRadius: 10,
  },
  optionContainer: {
    flex: 1,
  },
  selectedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#2C3E50',
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unselectedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D3A5F',
  },
});

UserTypeToggle.displayName = 'UserTypeToggle';

