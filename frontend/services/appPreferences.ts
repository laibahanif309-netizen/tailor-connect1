import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREF_COLOR_SCHEME = 'pref_color_scheme'; // 'light' | 'dark' | 'system'

export type ColorSchemePref = 'light' | 'dark' | 'system';

export async function getStringPref(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setStringPref(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export function applyColorSchemePref(pref: ColorSchemePref) {
  if (pref === 'system') {
    Appearance.setColorScheme(null);
  } else {
    Appearance.setColorScheme(pref);
  }
}

export async function applyStoredColorScheme(): Promise<void> {
  const s = await getStringPref(PREF_COLOR_SCHEME);
  if (s === 'light' || s === 'dark' || s === 'system') {
    applyColorSchemePref(s);
  }
}
