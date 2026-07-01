import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Input, InputField, InputIcon, InputSlot } from '../ui/input';
import { useDebounce } from '../../hooks/useDebounce';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface SearchInputProps {
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Current search value
   */
  value?: string;
  /**
   * Callback when search text changes
   */
  onChangeText?: (text: string) => void;
  /**
   * Callback when search is submitted
   */
  onSubmit?: (text: string) => void;
  /**
   * Callback when clear button is pressed
   */
  onClear?: () => void;
  /**
   * Whether to show clear button
   */
  showClearButton?: boolean;
  /**
   * Debounce delay in milliseconds
   */
  debounceMs?: number;
}

/**
 * SearchInput - Search input with icon and clear button
 * 
 * @example
 * ```tsx
 * <SearchInput 
 *   placeholder="Search tailors..."
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 * />
 * ```
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value = '',
  onChangeText,
  onSubmit,
  onClear,
  showClearButton = true,
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  useEffect(() => {
    if (debouncedValue !== value && onChangeText) {
      onChangeText(debouncedValue);
    }
  }, [debouncedValue]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(localValue);
    }
  };

  return (
    <Input style={styles.container}>
      <InputIcon>
        <MaterialCommunityIcons name="magnify" size={20} color="#C9A227" />
      </InputIcon>
      <InputField
        placeholder={placeholder}
        value={localValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      {showClearButton && localValue.length > 0 && (
        <InputSlot onPress={handleClear}>
          <InputIcon>
            <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
          </InputIcon>
        </InputSlot>
      )}
    </Input>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
});

SearchInput.displayName = 'SearchInput';
