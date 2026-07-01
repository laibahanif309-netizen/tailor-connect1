import React from 'react';
import { config } from './config';
import { View, ViewProps, useColorScheme, Appearance } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';

const sanitizeStyleObject = (styleObject: unknown) => {
  if (!styleObject || typeof styleObject !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(styleObject).filter(([, value]) => {
      const valueType = typeof value;
      return valueType === 'string' || valueType === 'number';
    })
  );
};

export function GluestackUIProvider({
  ...props
}: {
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const colorScheme = useColorScheme();
  const resolved = colorScheme ?? Appearance.getColorScheme() ?? 'light';
  const themeVars = resolved === 'dark' ? config.dark : config.light;
  const safeThemeStyle = sanitizeStyleObject(themeVars);

  return (
    <View
      style={[
        safeThemeStyle,
        { flex: 1 },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
