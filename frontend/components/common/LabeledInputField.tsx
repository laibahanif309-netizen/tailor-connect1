import React, { useMemo, useState } from 'react';
import { TextInputProps, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { useAppScreenTheme, type AppScreenTheme } from '../../hooks/useAppScreenTheme';

interface LabeledInputFieldProps {
  /**
   * Label text to display above the input field
   */
  label: string;
  /**
   * Placeholder text for the input field
   */
  placeholder?: string;
  /**
   * Current value of the input
   */
  value?: string;
  /**
   * Callback function when text changes
   */
  onChangeText?: (text: string) => void;
  /**
   * Callback function when input loses focus
   */
  onBlur?: () => void;
  /**
   * Icon element to display on the right side of the input field
   */
  icon?: React.ReactElement;
  /**
   * Whether the input is secure (for passwords)
   */
  secureTextEntry?: boolean;
  /**
   * Keyboard type for the input
   */
  keyboardType?: TextInputProps['keyboardType'];
  /**
   * Auto capitalization setting
   */
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /**
   * Callback function when icon is pressed
   */
  onIconPress?: () => void;
  /**
   * Whether the input is disabled
   */
  isDisabled?: boolean;
  /**
   * Error message to display
   */
  error?: string;
}

/**
 * LabeledInputField - A custom input component with label and optional right-side icon
 * 
 * This component provides a consistent input field design with:
 * - A label displayed above the input
 * - An optional icon displayed on the right side
 * - Styling that matches the design system
 * 
 * @example
 * ```tsx
 * import { Mail } from 'lucide-react-native';
 * 
 * <LabeledInputField
 *   label="Email Address"
 *   placeholder="Email Address"
 *   icon={<Mail size={20} color="#C9A227" />}
 *   value={email}
 *   onChangeText={setEmail}
 * />
 * ```
 */
export const LabeledInputField: React.FC<LabeledInputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  icon,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  onIconPress,
  isDisabled = false,
  error,
}) => {
  const t = useAppScreenTheme();
  const styles = useMemo(() => buildLabeledInputStyles(t), [t]);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>
      
      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        isFocused && !error && styles.inputContainerFocused,
        isDisabled && styles.inputContainerDisabled,
        error && styles.inputContainerError,
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder || label}
          placeholderTextColor={t.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!isDisabled}
        />
        
        {/* Icon */}
        {icon && (
          <TouchableOpacity 
            onPress={onIconPress} 
            disabled={!onIconPress}
            style={styles.iconContainer}
            activeOpacity={onIconPress ? 0.7 : 1}
          >
            {icon}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

function buildLabeledInputStyles(t: AppScreenTheme) {
  const shadow = t.isDark
    ? { shadowOpacity: 0, elevation: 0 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      };

  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: t.textPrimary,
      marginBottom: 8,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.isDark ? t.screenBg : '#FFFFFF',
      borderWidth: 1,
      borderColor: t.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 16,
      minHeight: 52,
      ...shadow,
    },
    inputContainerFocused: {
      borderColor: t.gold,
    },
    inputContainerDisabled: {
      backgroundColor: t.isDark ? t.menuIconBg : '#F3F4F6',
      opacity: 0.7,
    },
    inputContainerError: {
      borderColor: '#EF4444',
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: t.inputText,
      paddingVertical: 14,
    },
    iconContainer: {
      paddingLeft: 12,
    },
    errorText: {
      fontSize: 12,
      color: '#EF4444',
      marginTop: 4,
    },
  });
}

LabeledInputField.displayName = 'LabeledInputField';
