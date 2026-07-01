import React from 'react';
import { StyleSheet } from 'react-native';
import { VStack } from '../ui/vstack';
import { Text } from '../ui/text';
import { HStack } from '../ui/hstack';
import { Chip } from './Chip';

interface MultiSelectChipsProps {
  /**
   * Available options to select from
   */
  options: string[];
  /**
   * Currently selected options
   */
  selected: string[];
  /**
   * Callback when selection changes
   */
  onSelectionChange: (selected: string[]) => void;
  /**
   * Label text (optional)
   */
  label?: string;
  /**
   * Whether multiple selections are allowed
   */
  multiple?: boolean;
  /**
   * Minimum number of selections required
   */
  minSelections?: number;
  /**
   * Maximum number of selections allowed
   */
  maxSelections?: number;
}

/**
 * MultiSelectChips - Multi-select chips for specializations, filters
 * 
 * @example
 * ```tsx
 * <MultiSelectChips 
 *   options={['Men\'s Wear', 'Women\'s Wear']}
 *   selected={selectedSpecs}
 *   onSelectionChange={setSelectedSpecs}
 *   label="Specializations"
 * />
 * ```
 */
export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  options,
  selected,
  onSelectionChange,
  label,
  multiple = true,
  minSelections = 0,
  maxSelections,
}) => {
  const handleChipPress = (option: string) => {
    const isSelected = selected.includes(option);
    
    if (!multiple) {
      // Single select
      onSelectionChange(isSelected ? [] : [option]);
      return;
    }

    // Multi select
    let newSelected: string[];
    
    if (isSelected) {
      // Deselect
      if (selected.length > minSelections) {
        newSelected = selected.filter((item) => item !== option);
      } else {
        // Can't deselect if at minimum
        return;
      }
    } else {
      // Select
      if (maxSelections && selected.length >= maxSelections) {
        // Can't select more if at maximum
        return;
      }
      newSelected = [...selected, option];
    }

    onSelectionChange(newSelected);
  };

  return (
    <VStack space="sm">
      {label && <Text style={styles.label}>{label}</Text>}
      <HStack space="xs" flexWrap="wrap" style={{flexDirection: 'row', gap: 4}}>
        {options.map((option, index) => (
          <Chip
            key={index}
            label={option}
            selected={selected.includes(option)}
            onPress={() => handleChipPress(option)}
            size="md"
          />
        ))}
      </HStack>
    </VStack>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3A5F',
    marginBottom: 4,
  },
});

MultiSelectChips.displayName = 'MultiSelectChips';
