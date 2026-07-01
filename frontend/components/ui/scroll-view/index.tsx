'use client';

import React, { forwardRef } from 'react';
import {
  ScrollView as RNScrollView,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';

export type { KeyboardAwareScrollViewProps as ScrollViewProps } from 'react-native-keyboard-controller';

/**
 * Vertical lists use KeyboardAwareScrollView so focused fields stay above the keyboard.
 * Horizontal scroll views fall back to RN ScrollView (carousel rows, etc.).
 */
export const ScrollView = forwardRef<RNScrollView, KeyboardAwareScrollViewProps>(
  function ScrollView({ bottomOffset = 24, keyboardShouldPersistTaps = 'handled', ...rest }, ref) {
    if (rest.horizontal) {
      return (
        <RNScrollView
          ref={ref}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          {...rest}
        />
      );
    }
    return (
      <KeyboardAwareScrollView
        ref={ref}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...rest}
      />
    );
  }
);
