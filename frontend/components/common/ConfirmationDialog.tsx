import React from 'react';
import { StyleSheet } from 'react-native';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogFooter,
  AlertDialogBody,
} from '../ui/alert-dialog';
import { Heading } from '../ui/heading';
import { Text } from '../ui/text';
import { Button, ButtonText } from '../ui/button';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ConfirmationDialogProps {
  /**
   * Whether dialog is visible
   */
  visible: boolean;
  /**
   * Dialog title
   */
  title: string;
  /**
   * Dialog message
   */
  message: string;
  /**
   * Confirm button label
   */
  confirmLabel?: string;
  /**
   * Cancel button label
   */
  cancelLabel?: string;
  /**
   * Callback when confirmed
   */
  onConfirm: () => void;
  /**
   * Callback when cancelled
   */
  onCancel: () => void;
  /**
   * Variant (destructive for delete actions)
   */
  variant?: 'default' | 'destructive';
}

/**
 * ConfirmationDialog - Reusable confirmation dialog
 * 
 * @example
 * ```tsx
 * <ConfirmationDialog 
 *   visible={showDialog}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close dialog after confirm
  };

  return (
    <AlertDialog isOpen={visible} onClose={onCancel} size="md">
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Heading style={styles.title}>{title}</Heading>
          <AlertDialogCloseButton>
            <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
          </AlertDialogCloseButton>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text style={styles.message}>{message}</Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={onCancel} style={styles.cancelButton}>
            <ButtonText>{cancelLabel}</ButtonText>
          </Button>
          <Button
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              variant === 'destructive' && styles.destructiveButton,
            ]}
          >
            <ButtonText>{confirmLabel}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D3A5F',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cancelButton: {
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#C9A227',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
});

ConfirmationDialog.displayName = 'ConfirmationDialog';

