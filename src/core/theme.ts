import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useProfileStore } from '../modules/profile/profileStore';

const light = {
  dark: false,
  bg: '#FFFFFF',
  card: '#FFFFFF',
  soft: '#F2F3F5',
  ink: '#0A0A0A',
  text2: '#3A3A3C',
  textMuted: '#6B6B70',
  textFaint: '#7F7F86',
  line: '#ECECEE',
  inverse: '#0A0A0A',
  accent: '#4F46E5',
  accentSoft: '#EEF2FF',
  income: '#059669',
  incomeSoft: '#ECFDF5',
  expense: '#E11D48',
  expenseSoft: '#FFF1F2',
  warn: '#D97706',
  warnSoft: '#FFFBEB',
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export type Palette = typeof light & { tint: (hex: string) => string; shade: (hex: string) => string };

const dark: typeof light = {
  dark: true,
  bg: '#000000',
  card: '#121214',
  soft: '#1C1C1E',
  ink: '#F5F5F7',
  text2: '#D1D1D6',
  textMuted: '#A1A1A6',
  textFaint: '#8A8A90',
  line: '#26262A',
  inverse: '#1C1C1E',
  accent: '#6366F1',
  accentSoft: '#1E1B4B',
  income: '#34D399',
  incomeSoft: '#06281D',
  expense: '#FB7185',
  expenseSoft: '#3B0D19',
  warn: '#FBBF24',
  warnSoft: '#33240A',
  overlay: 'rgba(0, 0, 0, 0.65)',
};

const toHsl = (hex: string, s: number, l: number) => {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = m.slice(1).map((v) => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  s = max === min ? 0 : s;
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const lightPalette: Palette = { ...light, tint: (hex) => hex, shade: (hex) => hex };
const darkPalette: Palette = { ...dark, tint: (hex) => toHsl(hex, 0.45, 0.17), shade: (hex) => toHsl(hex, 0.75, 0.74) };

export const colors = light;

export const useTextScale = () => {
  const size = useProfileStore((s) => s.textSize);
  return size === 'xlarge' ? 1.3 : size === 'large' ? 1.15 : 1;
};

export const useColors = (): Palette => {
  const system = useColorScheme();
  const mode = useProfileStore((s) => s.themeMode);
  const isDark = mode === 'dark' || (mode !== 'light' && system === 'dark');
  return isDark ? darkPalette : lightPalette;
};

const cache = new WeakMap<object, Map<Palette, unknown>>();

export const useStyles = <T,>(make: (c: Palette) => T): T => {
  const c = useColors();
  return useMemo(() => {
    let byPalette = cache.get(make) as Map<Palette, T> | undefined;
    if (!byPalette) {
      byPalette = new Map();
      cache.set(make, byPalette);
    }
    if (!byPalette.has(c)) byPalette.set(c, make(c));
    return byPalette.get(c)!;
  }, [c, make]);
};

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
