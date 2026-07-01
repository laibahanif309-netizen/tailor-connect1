import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../ui/text';
import { useAppScreenTheme } from '../../hooks/useAppScreenTheme';

export type ProfileMenuRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
};

/**
 * Profile / settings list row — matches customer profile shortcuts (icon tile, title, subtitle, chevron).
 */
export function ProfileMenuRow({ icon, title, subtitle, onPress, danger, last }: ProfileMenuRowProps) {
  const t = useAppScreenTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: last ? 'transparent' : t.divider,
          gap: 12,
        },
      ]}
      android_ripple={{ color: t.headerBorder }}
    >
      <View
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: danger ? (t.isDark ? '#450A0A' : '#FEF2F2') : t.menuIconBg,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={22} color={danger ? '#EF4444' : t.menuIcon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: danger ? '#EF4444' : t.textPrimary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={t.chevron} />
    </Pressable>
  );
}
