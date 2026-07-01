import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack } from '../ui/hstack';
import { VStack } from '../ui/vstack';
import { Button, ButtonText } from '../ui/button';
import { GradientButton } from './GradientButton';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ActionButton {
  label: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface ActionButtonGroupProps {
  /**
   * Array of action buttons
   */
  actions: ActionButton[];
  /**
   * Layout direction
   */
  layout?: 'horizontal' | 'vertical';
}

/**
 * ActionButtonGroup - Group of action buttons (Place Order, Book Visit, Message, Call)
 * 
 * @example
 * ```tsx
 * <ActionButtonGroup 
 *   actions={[
 *     { label: 'Place Order', icon: 'shopping', onPress: () => {}, variant: 'primary' },
 *     { label: 'Message', icon: 'message', onPress: () => {}, variant: 'secondary' }
 *   ]}
 * />
 * ```
 */
export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  actions,
  layout = 'horizontal',
}) => {
  if (layout === 'horizontal') {
    return (
      <HStack space="sm" style={styles.horizontalContainer}>
        {actions.map((action, index) => {
          if (action.variant === 'primary') {
            return (
              <GradientButton
                key={index}
                title={action.label}
                onPress={action.onPress}
                height={48}
                borderRadius={24}
                style={styles.horizontalButton}
              />
            );
          }

          return (
            <Button
              key={index}
              onPress={action.onPress}
              variant={action.variant === 'outline' ? 'outline' : 'solid'}
              style={styles.horizontalButton}
            >
              <HStack space="xs" style={styles.buttonContent}>
                {action.icon && (
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={20}
                    color={action.variant === 'outline' ? '#C9A227' : '#FFFFFF'}
                  />
                )}
                <ButtonText>{action.label}</ButtonText>
              </HStack>
            </Button>
          );
        })}
      </HStack>
    );
  }

  return (
    <VStack space="sm" style={styles.container}>
      {actions.map((action, index) => {
        if (action.variant === 'primary') {
          return (
            <GradientButton
              key={index}
              title={action.label}
              onPress={action.onPress}
              height={48}
              borderRadius={24}
            />
          );
        }

        return (
          <Button
            key={index}
            onPress={action.onPress}
            variant={action.variant === 'outline' ? 'outline' : 'solid'}
            style={styles.verticalButton}
          >
            <HStack space="xs" style={styles.buttonContent}>
              {action.icon && (
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={20}
                  color={action.variant === 'outline' ? '#C9A227' : '#FFFFFF'}
                />
              )}
              <ButtonText>{action.label}</ButtonText>
            </HStack>
          </Button>
        );
      })}
    </VStack>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  horizontalContainer: {
    width: '100%',
    flexDirection: 'row',
  },
  horizontalButton: {
    flex: 1,
  },
  verticalButton: {
    width: '100%',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

ActionButtonGroup.displayName = 'ActionButtonGroup';

