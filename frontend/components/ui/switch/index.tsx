'use client';
import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { createSwitch } from '@gluestack-ui/core/switch/creator';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { withStyleContext } from '@gluestack-ui/utils/nativewind-utils';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';

const UISwitch = createSwitch({
  Root: withStyleContext(RNSwitch),
});

const switchStyle = tva({
  base: 'data-[focus=true]:outline-0 data-[focus=true]:ring-2 data-[focus=true]:ring-indicator-primary web:cursor-pointer disabled:cursor-not-allowed data-[disabled=true]:opacity-40 data-[invalid=true]:border-error-700 data-[invalid=true]:rounded-xl data-[invalid=true]:border-2',

  variants: {
    size: {
      sm: 'scale-75',
      md: '',
      lg: 'scale-125',
    },
  },
});

type ISwitchProps = Omit<React.ComponentProps<typeof UISwitch>, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> &
  VariantProps<typeof switchStyle> & {
    trackColor?: {
      false?: string;
      true?: string;
    };
    thumbColor?: string;
    ios_backgroundColor?: string;
  };

const Switch = React.forwardRef<
  React.ComponentRef<typeof UISwitch>,
  ISwitchProps
>(function Switch({ 
  className, 
  size = 'md', 
  trackColor,
  thumbColor,
  ios_backgroundColor,
  ...props 
}, ref) {
  // Default colors matching project theme
  const defaultTrackColor = {
    false: '#E5E7EB', // Light gray when off
    true: '#C9A227', // Gold when on
    ...trackColor,
  };

  const defaultThumbColor = thumbColor || '#FFFFFF'; // White thumb
  const defaultIosBackgroundColor = ios_backgroundColor || '#E5E7EB'; // Light gray for iOS

  // Extract className from props if it exists
  const { className: _, ...restProps } = props as any;

  return (
    <UISwitch
      ref={ref}
      {...restProps}
      className={switchStyle({ size, class: className })}
      trackColor={defaultTrackColor}
      thumbColor={defaultThumbColor}
      ios_backgroundColor={defaultIosBackgroundColor}
    />
  );
});

Switch.displayName = 'Switch';
export { Switch };
