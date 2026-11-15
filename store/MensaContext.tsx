import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, AppState, Platform, useColorScheme } from 'react-native';

import { DEFAULT_DETAIL_SECTION_ORDER } from '@/constants/detailSections';
import {
  detectSystemLanguage,
  getTranslations,
  type TranslationDictionary,
} from '@/constants/i18n';
import { ThemeColors, type ThemePalette } from '@/constants/theme';
import { fetchMealPlan } from '@/lib/api/client';
import { loadFavorites, saveFavorites } from '@/lib/storage/favorites';
import {
  DEFAULT_DETAIL_SECTIONS,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
} from '@/lib/storage/preferences';
import { getOrCreateClientId } from '@/lib/storage/secureClient';
import { getInitialWeekdayString, shiftWeekdayDate } from '@/lib/utils/date';
import { cleanLineName, getMealImageUrls } from '@/lib/utils/meals';
import type {
  ActiveFilters,
  AppLanguage,
  Canteen,
  FavoriteSnapshot,
  LanguagePreference,
  Meal,
  MealDetailSectionKey,
  MealDetailSections,
  PriceTier,
  ThemePreference,
  UserPreferences,
} from '@/types/mensa';

interface MensaContextValue {
  isHydrated: boolean;
  date: string;
  todayWeekday: string;
  setDate: (nextDate: string) => void;
  shiftDate: (weekdayDelta: number) => void;
  goToToday: () => void;
  canteens: Canteen[];
  selectedCanteen: Canteen | null;
  selectedCanteenId: string;
  setSelectedCanteenId: (id: string) => void;
  priceMode: PriceTier;
  setPriceMode: (tier: PriceTier) => void;
  themeMode: ThemePreference;
  setThemeMode: (mode: ThemePreference) => void;
  languagePreference: LanguagePreference;
  setLanguagePreference: (language: LanguagePreference) => void;
  effectiveLanguage: AppLanguage;
  t: TranslationDictionary;
  skipWeekends: boolean;
  setSkipWeekends: (enabled: boolean) => void;
  customApiUrl: string | null;
  setCustomApiUrl: (url: string | null) => void;
  detailSections: MealDetailSections;
  setDetailSectionVisible: (section: keyof MealDetailSections, visible: boolean) => void;
  detailSectionOrder: MealDetailSectionKey[];
  setDetailSectionOrder: (order: MealDetailSectionKey[]) => void;
  resetDetailLayout: () => void;
  effectiveScheme: 'light' | 'dark';
  palette: ThemePalette;
  activeFilters: ActiveFilters;
  toggleFilter: (key: keyof ActiveFilters) => void;
  favorites: Record<string, FavoriteSnapshot>;
  favoriteIds: Set<string>;
  toggleFavorite: (meal: Pick<Meal, 'id' | 'name' | 'mealType' | 'images'>) => void;
  removeFavoriteById: (mealId: string) => void;
  isLoading: boolean;
  isRefetching: boolean;
  error: Error | null;
  dataUpdatedAt: number;
  refreshPlan: () => Promise<void>;
  clearOfflineCache: () => Promise<void>;
}

const MensaContext = createContext<MensaContextValue | null>(null);

function triggerSelectionHaptic() {
  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync().catch(() => {});
  }
}

function triggerImpactHaptic(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(style).catch(() => {});
  }
}

function triggerNotificationHaptic(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS === 'ios') {
    void Haptics.notificationAsync(type).catch(() => {});
  }
}

export function MensaProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const systemScheme = useColorScheme();

  const [isHydrated, setIsHydrated] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [systemLanguage, setSystemLanguage] = useState<AppLanguage>(() => detectSystemLanguage());
  const [date, setDateState] = useState<string>(() => getInitialWeekdayString(true));
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    vegan: false,
    vegetarian: false,
    favoritesOnly: false,
  });
  const [favorites, setFavorites] = useState<Record<string, FavoriteSnapshot>>({});
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [loadedPrefs, loadedFavorites] = await Promise.all([
          loadPreferences(),
          loadFavorites(),
          getOrCreateClientId(),
        ]);
        if (!mounted) {
          return;
        }
        setPrefs(loadedPrefs);
        setFavorites(loadedFavorites);
        setDateState(getInitialWeekdayString(loadedPrefs.skipWeekends));
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    try {
      Appearance.setColorScheme(prefs.themeMode === 'system' ? 'unspecified' : prefs.themeMode);
    } catch {
      // Ignore if platform does not support programmatic override
    }
  }, [isHydrated, prefs.themeMode]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setSystemLanguage(detectSystemLanguage());
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const updatePrefs = useCallback((updater: (prev: UserPreferences) => UserPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      void savePreferences(next);
      return next;
    });
  }, []);

  const setSelectedCanteenId = useCallback(
    (id: string) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({ ...prev, selectedCanteenId: id }));
    },
    [updatePrefs],
  );

  const setPriceMode = useCallback(
    (priceMode: PriceTier) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({ ...prev, priceMode }));
    },
    [updatePrefs],
  );

  const setThemeMode = useCallback(
    (themeMode: ThemePreference) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({ ...prev, themeMode }));
    },
    [updatePrefs],
  );

  const setLanguagePreference = useCallback(
    (languagePreference: LanguagePreference) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({ ...prev, languagePreference }));
    },
    [updatePrefs],
  );

  const setSkipWeekends = useCallback(
    (skipWeekends: boolean) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({ ...prev, skipWeekends }));
    },
    [updatePrefs],
  );

  const setCustomApiUrl = useCallback(
    (customApiUrl: string | null) => {
      const normalized = customApiUrl?.trim() ? customApiUrl.trim() : null;
      updatePrefs((prev) => ({ ...prev, customApiUrl: normalized }));
    },
    [updatePrefs],
  );

  const setDetailSectionVisible = useCallback(
    (section: keyof MealDetailSections, visible: boolean) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({
        ...prev,
        detailSections: {
          ...prev.detailSections,
          [section]: visible,
        },
      }));
    },
    [updatePrefs],
  );

  const setDetailSectionOrder = useCallback(
    (detailSectionOrder: MealDetailSectionKey[]) => {
      triggerSelectionHaptic();
      updatePrefs((prev) => ({
        ...prev,
        detailSectionOrder,
      }));
    },
    [updatePrefs],
  );

  const resetDetailLayout = useCallback(() => {
    triggerSelectionHaptic();
    updatePrefs((prev) => ({
      ...prev,
      detailSections: DEFAULT_DETAIL_SECTIONS,
      detailSectionOrder: DEFAULT_DETAIL_SECTION_ORDER,
    }));
  }, [updatePrefs]);

  const mealPlanQuery = useQuery({
    queryKey: ['mealPlan', date, prefs.customApiUrl ?? 'default'],
    queryFn: () => fetchMealPlan(date, { customApiUrl: prefs.customApiUrl }),
    enabled: isHydrated,
  });

  const canteens = useMemo(() => {
    const raw = mealPlanQuery.data ?? [];
    return raw.map((canteen) => ({
      ...canteen,
      lines: canteen.lines.map((line) => ({
        ...line,
        name: cleanLineName(line.name),
      })),
    }));
  }, [mealPlanQuery.data]);

  const resolvedCanteenId = useMemo(() => {
    if (canteens.length === 0) {
      return prefs.selectedCanteenId;
    }
    const exists = canteens.some((c) => c.id === prefs.selectedCanteenId);
    return exists ? prefs.selectedCanteenId : canteens[0].id;
  }, [canteens, prefs.selectedCanteenId]);

  const selectedCanteen = useMemo(
    () => canteens.find((c) => c.id === resolvedCanteenId) ?? null,
    [canteens, resolvedCanteenId],
  );

  const setDate = useCallback((nextDate: string) => {
    triggerSelectionHaptic();
    setDateState(nextDate);
  }, []);

  const shiftDate = useCallback(
    (weekdayDelta: number) => {
      triggerSelectionHaptic();
      setDateState((prev) => shiftWeekdayDate(prev, weekdayDelta, prefs.skipWeekends));
    },
    [prefs.skipWeekends],
  );

  const todayWeekday = useMemo(
    () => getInitialWeekdayString(prefs.skipWeekends),
    [prefs.skipWeekends],
  );

  const goToToday = useCallback(() => {
    const target = getInitialWeekdayString(prefs.skipWeekends);
    triggerSelectionHaptic();
    setDateState(target);
  }, [prefs.skipWeekends]);

  const toggleFilter = useCallback((key: keyof ActiveFilters) => {
    triggerSelectionHaptic();
    setActiveFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const favoriteIds = useMemo(() => new Set(Object.keys(favorites)), [favorites]);

  const toggleFavorite = useCallback(
    (meal: Pick<Meal, 'id' | 'name' | 'mealType' | 'images'>) => {
      const mealId = String(meal.id ?? '');
      if (!mealId) {
        return;
      }
      triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
      setFavorites((prev) => {
        const next = { ...prev };
        if (mealId in next) {
          delete next[mealId];
        } else {
          const urls = getMealImageUrls(meal);
          next[mealId] = {
            id: mealId,
            name: meal.name,
            mealType: meal.mealType,
            lastSeenDate: date,
            imageUrl: urls[0],
          };
        }
        void saveFavorites(next);
        return next;
      });
    },
    [date],
  );

  const removeFavoriteById = useCallback((mealId: string) => {
    triggerImpactHaptic(Haptics.ImpactFeedbackStyle.Light);
    setFavorites((prev) => {
      if (!(mealId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[mealId];
      void saveFavorites(next);
      return next;
    });
  }, []);

  const refreshPlan = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      const fresh = await fetchMealPlan(date, {
        forceRefresh: true,
        customApiUrl: prefs.customApiUrl,
      });
      queryClient.setQueryData(['mealPlan', date, prefs.customApiUrl ?? 'default'], fresh);
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    } catch {
      triggerNotificationHaptic(Haptics.NotificationFeedbackType.Error);
      await mealPlanQuery.refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [date, mealPlanQuery, prefs.customApiUrl, queryClient]);

  const clearOfflineCache = useCallback(async () => {
    queryClient.clear();
    try {
      await ExpoImage.clearDiskCache();
    } catch {
      // Ignore image cache clear failure
    }
    triggerNotificationHaptic(Haptics.NotificationFeedbackType.Success);
    await mealPlanQuery.refetch();
  }, [mealPlanQuery, queryClient]);

  const effectiveScheme: 'light' | 'dark' = useMemo(() => {
    if (prefs.themeMode === 'light' || prefs.themeMode === 'dark') {
      return prefs.themeMode;
    }
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [prefs.themeMode, systemScheme]);

  const effectiveLanguage: AppLanguage = useMemo(() => {
    if (prefs.languagePreference === 'en' || prefs.languagePreference === 'de') {
      return prefs.languagePreference;
    }
    return systemLanguage;
  }, [prefs.languagePreference, systemLanguage]);

  const t = useMemo(() => getTranslations(effectiveLanguage), [effectiveLanguage]);

  const palette = ThemeColors[effectiveScheme];

  const value = useMemo<MensaContextValue>(
    () => ({
      isHydrated,
      date,
      todayWeekday,
      setDate,
      shiftDate,
      goToToday,
      canteens,
      selectedCanteen,
      selectedCanteenId: resolvedCanteenId,
      setSelectedCanteenId,
      priceMode: prefs.priceMode,
      setPriceMode,
      themeMode: prefs.themeMode,
      setThemeMode,
      languagePreference: prefs.languagePreference,
      setLanguagePreference,
      effectiveLanguage,
      t,
      skipWeekends: prefs.skipWeekends,
      setSkipWeekends,
      customApiUrl: prefs.customApiUrl,
      setCustomApiUrl,
      detailSections: prefs.detailSections,
      setDetailSectionVisible,
      detailSectionOrder: prefs.detailSectionOrder,
      setDetailSectionOrder,
      resetDetailLayout,
      effectiveScheme,
      palette,
      activeFilters,
      toggleFilter,
      favorites,
      favoriteIds,
      toggleFavorite,
      removeFavoriteById,
      isLoading: !isHydrated || (mealPlanQuery.isLoading && canteens.length === 0),
      isRefetching: isManualRefreshing,
      error: mealPlanQuery.error instanceof Error ? mealPlanQuery.error : null,
      dataUpdatedAt: mealPlanQuery.dataUpdatedAt,
      refreshPlan,
      clearOfflineCache,
    }),
    [
      activeFilters,
      canteens,
      clearOfflineCache,
      date,
      effectiveLanguage,
      effectiveScheme,
      favoriteIds,
      favorites,
      goToToday,
      isHydrated,
      isManualRefreshing,
      mealPlanQuery.dataUpdatedAt,
      mealPlanQuery.error,
      mealPlanQuery.isLoading,
      palette,
      prefs.customApiUrl,
      prefs.detailSectionOrder,
      prefs.detailSections,
      prefs.languagePreference,
      prefs.priceMode,
      prefs.skipWeekends,
      prefs.themeMode,
      refreshPlan,
      removeFavoriteById,
      resetDetailLayout,
      resolvedCanteenId,
      selectedCanteen,
      setCustomApiUrl,
      setDate,
      setDetailSectionOrder,
      setDetailSectionVisible,
      setLanguagePreference,
      setPriceMode,
      setSelectedCanteenId,
      setSkipWeekends,
      setThemeMode,
      shiftDate,
      t,
      todayWeekday,
      toggleFavorite,
      toggleFilter,
    ],
  );

  return <MensaContext.Provider value={value}>{children}</MensaContext.Provider>;
}

export function useMensa(): MensaContextValue {
  const ctx = useContext(MensaContext);
  if (!ctx) {
    throw new Error('useMensa must be used inside a MensaProvider');
  }
  return ctx;
}
