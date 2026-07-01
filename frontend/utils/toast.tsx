/**
 * Toast Utility Helper
 *
 * Provides easy-to-use functions for showing toast notifications
 * using the Gluestack UI toast system.
 *
 * All handlers are memoized so screens can safely put `showError` etc.
 * in useCallback/useEffect deps without re-fetch loops / flicker.
 */

import React, { useCallback, useRef } from 'react';
import { useToast as useGluestackToast } from '../components/ui/toast';
import { Toast, ToastTitle, ToastDescription } from '../components/ui/toast';

type ToastAction = 'success' | 'error' | 'warning' | 'info' | 'muted';
type ToastVariant = 'solid' | 'outline';

/** Solid RN colors — Gluestack `className` on toast often does not resolve in the overlay. */
const TOAST_SOLID_PALETTE: Record<
  ToastAction,
  { backgroundColor: string; titleColor: string; descriptionColor: string }
> = {
  success: {
    backgroundColor: '#059669',
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.92)',
  },
  error: {
    backgroundColor: '#DC2626',
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.92)',
  },
  warning: {
    backgroundColor: '#D97706',
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.92)',
  },
  info: {
    backgroundColor: '#0284C7',
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.92)',
  },
  muted: {
    backgroundColor: '#374151',
    titleColor: '#FFFFFF',
    descriptionColor: 'rgba(255,255,255,0.92)',
  },
};

/** First non-empty line only, trimmed, capped — avoids stack traces / JSON in toasts. */
function sanitizeToastText(text: string, maxLen: number): string {
  const raw = String(text ?? '').trim();
  if (!raw) return '';
  const line =
    raw
      .split('\n')
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? '';
  if (line.length <= maxLen) return line;
  return `${line.slice(0, Math.max(0, maxLen - 1))}…`;
}

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: ToastAction;
  variant?: ToastVariant;
}

/**
 * Custom hook that provides toast notification functions
 */
export function useToast(): {
  showToast: (options: ToastOptions) => void;
  showSuccess: (title: string, description?: string) => void;
  showError: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
} {
  const toast = useGluestackToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const showToast = useCallback(
    ({
      title,
      description,
      duration = 3000,
      action = 'info',
      variant = 'solid',
    }: ToastOptions) => {
      const shouldSanitize = action === 'error' || action === 'warning';
      const displayTitle = shouldSanitize ? sanitizeToastText(title, 100) : title;
      let displayDescription: string | undefined;
      if (description) {
        const d = shouldSanitize
          ? sanitizeToastText(description, 180)
          : description.trim();
        displayDescription = d || undefined;
      }

      const solid = TOAST_SOLID_PALETTE[action];
      const isOutline = variant === 'outline';

      toastRef.current.show({
        placement: 'top',
        duration,
        render: ({ id }) => {
          const toastWrapStyle = isOutline
            ? {
                backgroundColor: '#FFFFFF',
                borderWidth: 2,
                borderColor: solid.backgroundColor,
              }
            : {
                backgroundColor: solid.backgroundColor,
                borderWidth: 0,
              };

          const titleColor = isOutline ? '#111827' : solid.titleColor;
          const descriptionColor = isOutline ? '#4B5563' : solid.descriptionColor;

          return (
            <Toast
              nativeID={`toast-${id}`}
              action={action}
              variant={variant}
              style={{
                minWidth: 300,
                maxWidth: '90%',
                padding: 12,
                borderRadius: 16,
                ...toastWrapStyle,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 6,
              }}
            >
              <ToastTitle style={{ color: titleColor }}>{displayTitle}</ToastTitle>
              {displayDescription ? (
                <ToastDescription style={{ color: descriptionColor }}>
                  {displayDescription}
                </ToastDescription>
              ) : null}
            </Toast>
          );
        },
      });
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      showToast({
        title,
        description,
        action: 'success',
      });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, description?: string) => {
      showToast({
        title,
        description,
        action: 'error',
      });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, description?: string) => {
      showToast({
        title,
        description,
        action: 'warning',
      });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, description?: string) => {
      showToast({
        title,
        description,
        action: 'info',
      });
    },
    [showToast]
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
