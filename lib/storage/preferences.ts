import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DETAIL_SECTION_ORDER } from '@/constants/detailSections';
import type {
  MealDetailSectionKey,
  MealDetailSections,
  UserPreferences,
} from '@/types/mensa';

const PREFERENCES_KEY = 'mensa-ka:preferences:v1';

export const DEFAULT_DETAIL_SECTIONS: MealDetailSections = {
  prices: true,
  nutrition: true,
  sides: true,
  allergens: true,
  environment: true,
  statistics: true,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  selectedCanteenId: '',
  priceMode: 'student',
  themeMode: 'system',
  languagePreference: 'system',
  skipWeekends: true,
  customApiUrl: null,
  detailSections: DEFAULT_DETAIL_SECTIONS,
  detailSectionOrder: DEFAULT_DETAIL_SECTION_ORDER,
};

function parseDetailSections(raw: unknown): MealDetailSections {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Partial<MealDetailSections>;
  return {
    prices: typeof input.prices === 'boolean' ? input.prices : true,
    nutrition: typeof input.nutrition === 'boolean' ? input.nutrition : true,
    sides: typeof input.sides === 'boolean' ? input.sides : true,
    allergens: typeof input.allergens === 'boolean' ? input.allergens : true,
    environment: typeof input.environment === 'boolean' ? input.environment : true,
    statistics: typeof input.statistics === 'boolean' ? input.statistics : true,
  };
}

function parseDetailSectionOrder(raw: unknown): MealDetailSectionKey[] {
  const validSet = new Set<MealDetailSectionKey>(DEFAULT_DETAIL_SECTION_ORDER);
  const result: MealDetailSectionKey[] = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (
        typeof entry === 'string' &&
        validSet.has(entry as MealDetailSectionKey) &&
        !result.includes(entry as MealDetailSectionKey)
      ) {
        result.push(entry as MealDetailSectionKey);
      }
    }
  }
  for (const fallbackKey of DEFAULT_DETAIL_SECTION_ORDER) {
    if (!result.includes(fallbackKey)) {
      result.push(fallbackKey);
    }
  }
  return result;
}

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      selectedCanteenId:
        typeof parsed.selectedCanteenId === 'string' ? parsed.selectedCanteenId : '',
      priceMode:
        parsed.priceMode === 'student' ||
        parsed.priceMode === 'employee' ||
        parsed.priceMode === 'pupil' ||
        parsed.priceMode === 'guest'
          ? parsed.priceMode
          : 'student',
      themeMode:
        parsed.themeMode === 'system' ||
        parsed.themeMode === 'light' ||
        parsed.themeMode === 'dark'
          ? parsed.themeMode
          : 'system',
      languagePreference:
        parsed.languagePreference === 'system' ||
        parsed.languagePreference === 'en' ||
        parsed.languagePreference === 'de'
          ? parsed.languagePreference
          : 'system',
      skipWeekends: typeof parsed.skipWeekends === 'boolean' ? parsed.skipWeekends : true,
      customApiUrl:
        typeof parsed.customApiUrl === 'string' && parsed.customApiUrl.trim()
          ? parsed.customApiUrl.trim()
          : null,
      detailSections: parseDetailSections(parsed.detailSections),
      detailSectionOrder: parseDetailSectionOrder(parsed.detailSectionOrder),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage write errors
  }
}
