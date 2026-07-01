import { useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';

/**
 * Semantic colors for screens that use StyleSheet (not Gluestack tokens).
 * Keeps customer/tailor tabs and lists aligned with Appearance / settings.
 */
export type AppScreenTheme = {
  isDark: boolean;
  screenBg: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  searchBg: string;
  inputText: string;
  filterTabIdleBg: string;
  filterTabLabel: string;
  listBg: string;
  /** Notification / subtle cards */
  cardBody: string;
  cardUnreadBg: string;
  cardUnreadBorder: string;
  markAllBg: string;
  markAllText: string;
  /** Profile & menus */
  menuIcon: string;
  menuIconBg: string;
  chevron: string;
  avatarFill: string;
  avatarInitials: string;
  rolePillBg: string;
  rolePillIcon: string;
  rolePillText: string;
  logoutBorder: string;
  logoutBtnBg: string;
  /** RN Text screen titles */
  rnTitleColor: string;
  gold: string;
};

export function useAppScreenTheme(): AppScreenTheme {
  const scheme = useColorScheme();
  const isDark = (scheme ?? Appearance.getColorScheme()) === 'dark';

  return useMemo(
    () =>
      isDark
        ? {
            isDark: true,
            screenBg: '#0F172A',
            headerBg: '#1E293B',
            headerBorder: '#334155',
            cardBg: '#1E293B',
            cardBorder: '#334155',
            textPrimary: '#F1F5F9',
            textSecondary: '#94A3B8',
            textMuted: '#64748B',
            divider: '#334155',
            searchBg: '#0F172A',
            inputText: '#F1F5F9',
            filterTabIdleBg: '#334155',
            filterTabLabel: '#94A3B8',
            listBg: '#0F172A',
            cardBody: '#CBD5E1',
            cardUnreadBg: '#422006',
            cardUnreadBorder: '#CA8A04',
            markAllBg: '#1E293B',
            markAllText: '#FEF3C7',
            menuIcon: '#93C5FD',
            menuIconBg: '#334155',
            chevron: '#64748B',
            avatarFill: '#1E293B',
            avatarInitials: '#E2E8F0',
            rolePillBg: '#422006',
            rolePillIcon: '#FCD34D',
            rolePillText: '#FEF3C7',
            logoutBorder: '#7F1D1D',
            logoutBtnBg: '#1E293B',
            rnTitleColor: '#F1F5F9',
            gold: '#C9A227',
          }
        : {
            isDark: false,
            screenBg: '#F5F6F8',
            headerBg: '#FFFFFF',
            headerBorder: '#E5E7EB',
            cardBg: '#FFFFFF',
            cardBorder: '#E5E7EB',
            textPrimary: '#1D3A5F',
            textSecondary: '#6B7280',
            textMuted: '#9CA3AF',
            divider: '#F3F4F6',
            searchBg: '#F9FAFB',
            inputText: '#1D3A5F',
            filterTabIdleBg: '#F5F6F8',
            filterTabLabel: '#9CA3AF',
            listBg: '#F5F6F8',
            cardBody: '#4B5563',
            cardUnreadBg: '#FFFCF3',
            cardUnreadBorder: '#E8D48B',
            markAllBg: '#FFFBF0',
            markAllText: '#1D3A5F',
            menuIcon: '#1D3A5F',
            menuIconBg: '#F5F6F8',
            chevron: '#9CA3AF',
            avatarFill: '#FFFFFF',
            avatarInitials: '#1D3A5F',
            rolePillBg: '#FEF3C7',
            rolePillIcon: '#92400E',
            rolePillText: '#92400E',
            logoutBorder: '#FECACA',
            logoutBtnBg: '#FFFFFF',
            rnTitleColor: '#1D3A5F',
            gold: '#C9A227',
          },
    [isDark]
  );
}
