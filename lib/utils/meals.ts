import type { SFSymbol } from 'sf-symbols-typescript';
import { getTranslations } from '@/constants/i18n';
import type { ActiveFilters, AppLanguage, FoodType, Line, Meal } from '@/types/mensa';

export function humanMealType(
  rawType: FoodType | string,
  language: AppLanguage = 'en',
): string {
  const { mealTypes } = getTranslations(language);
  switch (rawType) {
    case 'VEGAN':
    case 'VEGETARIAN':
    case 'POULTRY':
    case 'FISH':
    case 'BEEF':
    case 'BEEF_AW':
    case 'PORK':
    case 'PORK_AW':
      return mealTypes[rawType];
    default:
      return mealTypes.UNKNOWN;
  }
}

export function getMealTypeSymbol(rawType: FoodType | string): SFSymbol {
  switch (rawType) {
    case 'VEGAN':
      return 'leaf.fill';
    case 'VEGETARIAN':
      return 'carrot.fill';
    case 'FISH':
      return 'fish.fill';
    default:
      return 'fork.knife';
  }
}

export function getMealImageUrls(meal: Pick<Meal, 'images'> | null | undefined): string[] {
  if (!Array.isArray(meal?.images) || meal.images.length === 0) {
    return [];
  }

  const sorted = [...meal.images].sort((a, b) => {
    const rankA = typeof a?.rank === 'number' ? a.rank : Number.NEGATIVE_INFINITY;
    const rankB = typeof b?.rank === 'number' ? b.rank : Number.NEGATIVE_INFINITY;
    return rankB - rankA;
  });

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const entry of sorted) {
    const url = entry?.url;
    if (typeof url !== 'string' || url.length === 0 || seen.has(url)) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function filterMeals(
  meals: Meal[],
  filters: ActiveFilters,
  favoriteIds: Set<string>,
): Meal[] {
  const { vegan, vegetarian, favoritesOnly } = filters;

  return meals.filter((meal) => {
    const mealId = String(meal.id ?? '');
    const mealType = meal.mealType;

    if (favoritesOnly && !favoriteIds.has(mealId)) {
      return false;
    }
    if (vegan && mealType !== 'VEGAN') {
      return false;
    }
    if (vegetarian && mealType !== 'VEGAN' && mealType !== 'VEGETARIAN') {
      return false;
    }
    return true;
  });
}

/**
 * Filters a canteen line's meals by dietary/favorite filters and an optional search query.
 */
export function filterLineMeals(
  line: Pick<Line, 'name' | 'meals'>,
  filters: ActiveFilters,
  favoriteIds: Set<string>,
  query = '',
): Meal[] {
  const baseMeals = filterMeals(
    Array.isArray(line.meals) ? line.meals : [],
    filters,
    favoriteIds,
  );
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery || line.name.toLowerCase().includes(normalizedQuery)) {
    return baseMeals;
  }
  return baseMeals.filter((meal) => meal.name.toLowerCase().includes(normalizedQuery));
}

export function summarizeLines(
  lines: Line[],
  filters: ActiveFilters,
  favoriteIds: Set<string>,
): { mealCount: number; visibleLines: number } {
  let mealCount = 0;
  let visibleLines = 0;

  for (const line of lines) {
    const filtered = filterMeals(Array.isArray(line.meals) ? line.meals : [], filters, favoriteIds);
    mealCount += filtered.length;
    if (filtered.length > 0) {
      visibleLines += 1;
    }
  }

  return { mealCount, visibleLines };
}

export const ALLERGEN_LABELS: Record<string, string> = {
  CA: 'Cashews',
  DI: 'Spelt & gluten',
  EI: 'Eggs',
  ER: 'Peanuts',
  FI: 'Fish',
  GE: 'Barley & gluten',
  HF: 'Oat & gluten',
  HA: 'Hazelnuts',
  KA: 'Kamut & gluten',
  KR: 'Crustaceans',
  LU: 'Lupin',
  MA: 'Almonds',
  ML: 'Milk / lactose',
  PA: 'Brazil nuts',
  PE: 'Pecans',
  PI: 'Pistachios',
  QU: 'Macadamia nuts',
  RO: 'Rye & gluten',
  SA: 'Sesame',
  SE: 'Celery',
  SF: 'Sulphite',
  SN: 'Mustard',
  SO: 'Soya',
  WA: 'Walnuts',
  WE: 'Wheat & gluten',
  WT: 'Molluscs',
  LA: 'Animal rennet',
  GL: 'Gelatin',
};

export const ALLERGEN_LABELS_DE: Record<string, string> = {
  CA: 'Cashewnüsse',
  DI: 'Dinkel & Gluten',
  EI: 'Eier',
  ER: 'Erdnüsse',
  FI: 'Fisch',
  GE: 'Gerste & Gluten',
  HF: 'Hafer & Gluten',
  HA: 'Haselnüsse',
  KA: 'Kamut & Gluten',
  KR: 'Krebstiere',
  LU: 'Lupinen',
  MA: 'Mandeln',
  ML: 'Milch / Laktose',
  PA: 'Paranüsse',
  PE: 'Pekannüsse',
  PI: 'Pistazien',
  QU: 'Macadamianüsse',
  RO: 'Roggen & Gluten',
  SA: 'Sesam',
  SE: 'Sellerie',
  SF: 'Sulfite',
  SN: 'Senf',
  SO: 'Soja',
  WA: 'Walnüsse',
  WE: 'Weizen & Gluten',
  WT: 'Weichtiere',
  LA: 'Tierisches Lab',
  GL: 'Gelatine',
};

export const ADDITIVE_LABELS: Record<string, string> = {
  COLORANT: 'Colorant',
  PRESERVING_AGENTS: 'Preserving agents',
  ANTIOXIDANT_AGENTS: 'Antioxidant agents',
  FLAVOUR_ENHANCER: 'Flavour enhancer',
  PHOSPHATE: 'Phosphate',
  SURFACE_WAXED: 'Surface waxed',
  SULPHUR: 'Sulphur',
  ARTIFICIALLY_BLACKENED_OLIVES: 'Blackened olives',
  SWEETENER: 'Sweetener',
  LAXATIVE_IF_OVERUSED: 'Laxative if overused',
  PHENYLALANINE: 'Phenylalanine',
  ALCOHOL: 'Alcohol',
  PRESSED_MEAT: 'Pressed meat',
  GLAZING_WITH_CACAO: 'Glazed with cacao',
  PRESSED_FISH: 'Pressed fish',
};

export const ADDITIVE_LABELS_DE: Record<string, string> = {
  COLORANT: 'Farbstoff',
  PRESERVING_AGENTS: 'Konservierungsstoff',
  ANTIOXIDANT_AGENTS: 'Antioxidationsmittel',
  FLAVOUR_ENHANCER: 'Geschmacksverstärker',
  PHOSPHATE: 'Phosphat',
  SURFACE_WAXED: 'Gewachst',
  SULPHUR: 'Geschwefelt',
  ARTIFICIALLY_BLACKENED_OLIVES: 'Geschwärzt',
  SWEETENER: 'Süßungsmittel',
  LAXATIVE_IF_OVERUSED: 'Kann abführend wirken',
  PHENYLALANINE: 'Phenylalaninquelle',
  ALCOHOL: 'Alkohol',
  PRESSED_MEAT: 'Formfleisch',
  GLAZING_WITH_CACAO: 'Kakaohaltige Fettglasur',
  PRESSED_FISH: 'Formfisch',
};

export function getAllergenLabel(code: string, language: AppLanguage = 'en'): string {
  const labels = language === 'de' ? ALLERGEN_LABELS_DE : ALLERGEN_LABELS;
  return labels[code] ?? code;
}

export function getAdditiveLabel(code: string, language: AppLanguage = 'en'): string {
  const labels = language === 'de' ? ADDITIVE_LABELS_DE : ADDITIVE_LABELS;
  return labels[code] ?? code;
}

const UNNECESSARY_LINE_HOURS_PATTERN =
  /\s*(?:[,·]\s*)?(?:\(\s*11(?:[:.]00)?\s*[-–—]\s*14(?:[:.]00)?\s*Uhr\s*\)|\b11(?:[:.]00)?\s*[-–—]\s*14(?:[:.]00)?\s*Uhr\b)/gi;

/** Remove standard "11-14 Uhr" service-hour suffixes from line display names. */
export function cleanLineName(name: string): string {
  const stripped = name.replace(UNNECESSARY_LINE_HOURS_PATTERN, ' ');
  if (stripped === name) {
    return name;
  }
  const normalized = stripped
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,·\-–—]+|[\s,·\-–—]+$/g, '')
    .trim();
  return normalized || name.trim();
}
