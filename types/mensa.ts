export type FoodType =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'BEEF'
  | 'BEEF_AW'
  | 'PORK'
  | 'PORK_AW'
  | 'POULTRY'
  | 'FISH'
  | 'UNKNOWN';

export type PriceTier = 'student' | 'employee' | 'pupil' | 'guest';

export type Price = Record<PriceTier, number>;

export interface MealImage {
  id?: string;
  url: string;
  rank: number;
  upvotes?: number;
  downvotes?: number;
}

export interface Ratings {
  averageRating: number;
  ratingsCount: number;
  personalRating?: number | null;
}

export interface MealStatistics {
  lastServed?: string | null;
  nextServed?: string | null;
  frequency: number;
  new: boolean;
}

export interface EnvironmentInfo {
  averageRating: number;
  co2Rating: number;
  co2Value: number;
  waterRating: number;
  waterValue: number;
  animalWelfareRating: number;
  rainforestRating: number;
  maxRating: number;
}

export interface NutritionData {
  energy: number;
  protein: number;
  carbohydrates: number;
  sugar: number;
  fat: number;
  saturatedFat: number;
  salt: number;
}

export interface Side {
  id: string;
  name: string;
  mealType: FoodType;
  price: Price;
  allergens: string[];
  additives: string[];
}

export interface Meal {
  id: string;
  name: string;
  mealType: FoodType;
  images: MealImage[];
  ratings: Ratings;
  price: Price;
  allergens?: string[];
  additives?: string[];
  statistics?: MealStatistics | null;
  environmentInfo?: EnvironmentInfo | null;
  nutritionData?: NutritionData | null;
  sides?: Side[];
}

export interface Line {
  id: string;
  name: string;
  meals: Meal[] | null;
}

export interface Canteen {
  id: string;
  name: string;
  lines: Line[];
}

export interface ActiveFilters {
  vegan: boolean;
  vegetarian: boolean;
  favoritesOnly: boolean;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export type AppLanguage = 'en' | 'de';

export type LanguagePreference = 'system' | AppLanguage;

export interface FavoriteSnapshot {
  id: string;
  name: string;
  mealType: FoodType;
  lastSeenDate: string;
  imageUrl?: string;
}

export type MealDetailSectionKey =
  | 'prices'
  | 'nutrition'
  | 'sides'
  | 'allergens'
  | 'environment'
  | 'statistics';

export type MealDetailSections = Record<MealDetailSectionKey, boolean>;

export interface UserPreferences {
  selectedCanteenId: string;
  priceMode: PriceTier;
  themeMode: ThemePreference;
  languagePreference: LanguagePreference;
  skipWeekends: boolean;
  customApiUrl: string | null;
  detailSections: MealDetailSections;
  detailSectionOrder: MealDetailSectionKey[];
}
