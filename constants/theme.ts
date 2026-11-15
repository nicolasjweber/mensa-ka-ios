import type { FoodType } from '@/types/mensa';

export type ColorSchemeName = 'light' | 'dark';

export const ThemeColors = {
  light: {
    brand: '#007c6b',
    brandDark: '#006658',
    brandDeep: '#004d42',
    brandSoft: '#e4f4f1',
    brandInk: '#ffffff',
    canvas: '#f4f7f6',
    surface: '#ffffff',
    surfaceSoft: '#edf4f2',
    surfaceElevated: 'rgba(255, 255, 255, 0.92)',
    text: '#0f2622',
    muted: '#445e59',
    border: 'rgba(15, 38, 34, 0.11)',
    borderControl: '#7da69e',
    favorite: '#c92a54',
    starColor: '#b87400',
    skeletonStart: '#e1efec',
    skeletonEnd: '#cee5e0',
    veganBg: '#dff5e8',
    veganFg: '#0d5c33',
    vegBg: '#e5f5d9',
    vegFg: '#2b5911',
    fishBg: '#dfeff9',
    fishFg: '#0d4b73',
    meatBg: '#fbead9',
    meatFg: '#7c350a',
    danger: '#c6284d',
    warning: '#9a6000',
    modalBg: 'rgba(5, 16, 14, 0.96)',
  },
  dark: {
    brand: '#22c5ae',
    brandDark: '#16a893',
    brandDeep: '#5ce5d1',
    brandSoft: '#13312c',
    brandInk: '#06211c',
    canvas: '#0a1210',
    surface: '#121f1c',
    surfaceSoft: '#192a26',
    surfaceElevated: 'rgba(18, 31, 28, 0.90)',
    text: '#e8f5f1',
    muted: '#8fb4ac',
    border: 'rgba(232, 245, 241, 0.12)',
    borderControl: '#3b665e',
    favorite: '#ff6b8b',
    starColor: '#f5b935',
    skeletonStart: '#182b27',
    skeletonEnd: '#233c37',
    veganBg: '#103824',
    veganFg: '#7de5aa',
    vegBg: '#1c3610',
    vegFg: '#a4e374',
    fishBg: '#113047',
    fishFg: '#7ec7f5',
    meatBg: '#3f210d',
    meatFg: '#f7b07c',
    danger: '#ff7b98',
    warning: '#f5b935',
    modalBg: 'rgba(5, 16, 14, 0.96)',
  },
} as const;

export const Radii = {
  sm: 9,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export type ThemePalette = (typeof ThemeColors)['light'] | (typeof ThemeColors)['dark'];

export function getMealTypeColors(
  mealType: FoodType,
  palette: ThemePalette,
): { bg: string; fg: string } | null {
  switch (mealType) {
    case 'VEGAN':
      return { bg: palette.veganBg, fg: palette.veganFg };
    case 'VEGETARIAN':
      return { bg: palette.vegBg, fg: palette.vegFg };
    case 'FISH':
      return { bg: palette.fishBg, fg: palette.fishFg };
    case 'POULTRY':
    case 'BEEF':
    case 'BEEF_AW':
    case 'PORK':
    case 'PORK_AW':
      return { bg: palette.meatBg, fg: palette.meatFg };
    case 'UNKNOWN':
    default:
      return null;
  }
}
