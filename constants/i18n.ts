import { NativeModules } from 'react-native';
import type {
  AppLanguage,
  FoodType,
  LanguagePreference,
  MealDetailSectionKey,
  PriceTier,
  ThemePreference,
} from '@/types/mensa';

export function detectSystemLanguage(): AppLanguage {
  try {
    const settings = NativeModules.SettingsManager?.settings as
      | { AppleLocale?: string; AppleLanguages?: string[] }
      | undefined;
    const candidate =
      settings?.AppleLanguages?.[0] ??
      settings?.AppleLocale ??
      Intl.DateTimeFormat().resolvedOptions().locale ??
      'en';
    return String(candidate).toLowerCase().startsWith('de') ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveEffectiveLanguage(pref: LanguagePreference): AppLanguage {
  if (pref === 'en' || pref === 'de') {
    return pref;
  }
  return detectSystemLanguage();
}

export interface TranslationDictionary {
  tabs: {
    menu: string;
    favorites: string;
    settings: string;
    search: string;
  };
  common: {
    today: string;
    meal: string;
    meals: string;
    loading: string;
    new: string;
    mealPhoto: string;
  };
  weekStrip: {
    previousWeekday: string;
    nextWeekday: string;
    openCalendar: string;
    jumpToToday: string;
  };
  filters: {
    vegan: string;
    vegetarian: string;
    favoritesOnly: string;
    filterPrefix: string;
  };
  menu: {
    defaultTitle: string;
    selectCanteen: string;
    selectPriceTier: string;
    offlineCache: (timestamp: string) => string;
    loadFailed: string;
    noData: string;
    noMatchingMeals: string;
  };
  favorites: {
    title: string;
    servedOn: (dateText: string) => string;
    savedOtherDays: string;
    lastSeen: (dateText: string) => string;
    emptyTitle: string;
    emptyBody: string;
  };
  search: {
    title: string;
    placeholder: string;
    subtitleWithCanteen: (canteenName: string, dateText: string) => string;
    subtitleFallback: (dateText: string) => string;
    noMatches: (query: string, canteenName?: string) => string;
    noMeals: (canteenName?: string) => string;
  };
  calendar: {
    title: string;
    cancel: string;
    applyAccessibility: string;
    pickerTitle: string;
    selectedDay: string;
    applyButton: string;
    nextWeekButton: string;
    todayButton: string;
  };
  mealDetail: {
    fallbackTitle: string;
    loadFailed: string;
    loadingDetails: string;
    pricesTitle: string;
    nutritionTitle: string;
    sidesTitle: string;
    allergensTitle: string;
    environmentTitle: string;
    statisticsTitle: string;
    nutrition: {
      energy: string;
      protein: string;
      carbohydrates: string;
      sugar: string;
      fat: string;
      saturatedFat: string;
      salt: string;
    };
    environment: {
      co2: string;
      water: string;
    };
    statistics: {
      lastServed: string;
      nextServed: string;
      timesServed: string;
      firstTime: string;
      notScheduled: string;
    };
  };
  settings: {
    title: string;
    sectionsTitle: string;
    sections: {
      defaults: string;
      detailPage: string;
      appearance: string;
      dataCache: string;
      about: string;
    };
    rows: {
      canteen: string;
      priceTier: string;
      skipWeekends: string;
      sectionsAndOrder: string;
      theme: string;
      language: string;
      endpoint: string;
      resetEndpoint: string;
      clearCache: string;
      clearingCache: string;
      version: string;
      viewOnGithub: string;
    };
    cacheClearedTitle: string;
    cacheClearedBody: string;
    themes: Record<ThemePreference, string>;
    languages: Record<LanguagePreference, string>;
    detailEditor: {
      sectionTitle: string;
      footer: string;
      resetAccessibility: string;
    };
  };
  detailSections: Record<MealDetailSectionKey, string>;
  priceTiers: Record<PriceTier, string>;
  mealTypes: Record<FoodType, string>;
  ratings: {
    noRatings: string;
  };
  notFound: {
    title: string;
    message: string;
    cta: string;
  };
  lightbox: {
    share: string;
    close: string;
  };
}

const EN_TRANSLATIONS: TranslationDictionary = {
  tabs: {
    menu: 'Menu',
    favorites: 'Favorites',
    settings: 'Settings',
    search: 'Search',
  },
  common: {
    today: 'Today',
    meal: 'meal',
    meals: 'meals',
    loading: 'Loading…',
    new: 'New',
    mealPhoto: 'Meal photo',
  },
  weekStrip: {
    previousWeekday: 'Previous weekday',
    nextWeekday: 'Next weekday',
    openCalendar: 'Open date picker',
    jumpToToday: 'Jump to today',
  },
  filters: {
    vegan: 'Vegan',
    vegetarian: 'Vegetarian',
    favoritesOnly: 'Favorites',
    filterPrefix: 'Filter',
  },
  menu: {
    defaultTitle: 'Mensa KA',
    selectCanteen: 'Select canteen',
    selectPriceTier: 'Select price category',
    offlineCache: (timestamp) => `Offline cache from ${timestamp}.`,
    loadFailed: 'Failed to load meal data.',
    noData: 'No meal data available.',
    noMatchingMeals: 'No meals match your current filters.',
  },
  favorites: {
    title: 'Favorites',
    servedOn: (dateText) => `Served on ${dateText}`,
    savedOtherDays: 'Saved for Other Days',
    lastSeen: (dateText) => `Last seen ${dateText}`,
    emptyTitle: 'No Favorites Yet',
    emptyBody: 'Tap the heart icon on any dish in the Menu tab to save it here.',
  },
  search: {
    title: 'Search Meals',
    placeholder: 'Search dishes or lines',
    subtitleWithCanteen: (canteenName, dateText) => `${canteenName} · ${dateText}`,
    subtitleFallback: (dateText) => `Showing results for ${dateText}`,
    noMatches: (query, canteenName) =>
      `No dishes matching "${query}"${canteenName ? ` in ${canteenName}` : ''}`,
    noMeals: (canteenName) =>
      canteenName ? `No meals loaded for ${canteenName}.` : 'No meals loaded for this date.',
  },
  calendar: {
    title: 'Select Date',
    cancel: 'Cancel',
    applyAccessibility: 'Apply selected date',
    pickerTitle: 'Meal Plan Date',
    selectedDay: 'Selected Day',
    applyButton: 'Apply Selected Date',
    nextWeekButton: 'Jump Ahead 1 Week',
    todayButton: 'Jump to Today',
  },
  mealDetail: {
    fallbackTitle: 'Meal Details',
    loadFailed: 'Meal details could not be loaded.',
    loadingDetails: 'Loading meal details…',
    pricesTitle: 'Prices',
    nutritionTitle: 'Nutrition Facts',
    sidesTitle: 'Included / Available Sides',
    allergensTitle: 'Allergens & Additives',
    environmentTitle: 'Environmental Impact',
    statisticsTitle: 'Meal Statistics',
    nutrition: {
      energy: 'Energy',
      protein: 'Protein',
      carbohydrates: 'Carbohydrates',
      sugar: 'Sugar',
      fat: 'Fat',
      saturatedFat: 'Saturated Fat',
      salt: 'Salt',
    },
    environment: {
      co2: 'CO₂ Emissions',
      water: 'Water Usage',
    },
    statistics: {
      lastServed: 'Last Served',
      nextServed: 'Next Served',
      timesServed: 'Times Served (Last 3 Months)',
      firstTime: 'First time',
      notScheduled: 'Not scheduled',
    },
  },
  settings: {
    title: 'Settings',
    sectionsTitle: 'Detail Sections',
    sections: {
      defaults: 'Meal Plan Defaults',
      detailPage: 'Meal Detail Page',
      appearance: 'Appearance',
      dataCache: 'Data & Offline Cache',
      about: 'About',
    },
    rows: {
      canteen: 'Canteen',
      priceTier: 'Price Tier',
      skipWeekends: 'Skip Weekends',
      sectionsAndOrder: 'Sections & Order',
      theme: 'Theme',
      language: 'Language',
      endpoint: 'Endpoint',
      resetEndpoint: 'Reset to api.mensa-ka.de',
      clearCache: 'Clear Offline Cache',
      clearingCache: 'Clearing Cache…',
      version: 'Version',
      viewOnGithub: 'View on GitHub',
    },
    cacheClearedTitle: 'Cache Cleared',
    cacheClearedBody: 'Offline menus and cached dish photos have been refreshed.',
    themes: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    languages: {
      system: 'System',
      de: 'Deutsch',
      en: 'English',
    },
    detailEditor: {
      sectionTitle: 'Order & Visibility',
      footer:
        'Drag the handles to change the order shown on meal detail pages, or toggle switches to hide sections.',
      resetAccessibility: 'Reset default order and visibility',
    },
  },
  detailSections: {
    prices: 'Prices',
    nutrition: 'Nutrition Facts',
    sides: 'Included Sides',
    allergens: 'Allergens & Additives',
    environment: 'Environmental Impact',
    statistics: 'Meal Statistics',
  },
  priceTiers: {
    student: 'Student',
    employee: 'Employee',
    pupil: 'Pupil',
    guest: 'Guest',
  },
  mealTypes: {
    VEGAN: 'Vegan',
    VEGETARIAN: 'Vegetarian',
    BEEF: 'Beef',
    BEEF_AW: 'Beef',
    PORK: 'Pork',
    PORK_AW: 'Pork',
    POULTRY: 'Poultry',
    FISH: 'Fish',
    UNKNOWN: 'Unknown',
  },
  ratings: {
    noRatings: 'No ratings yet',
  },
  notFound: {
    title: 'Not Found',
    message: 'This screen does not exist.',
    cta: 'Return to Menu',
  },
  lightbox: {
    share: 'Share photo',
    close: 'Close photo viewer',
  },
};

const DE_TRANSLATIONS: TranslationDictionary = {
  tabs: {
    menu: 'Speiseplan',
    favorites: 'Favoriten',
    settings: 'Einstellungen',
    search: 'Suche',
  },
  common: {
    today: 'Heute',
    meal: 'Gericht',
    meals: 'Gerichte',
    loading: 'Lädt…',
    new: 'Neu',
    mealPhoto: 'Essensfoto',
  },
  weekStrip: {
    previousWeekday: 'Vorheriger Wochentag',
    nextWeekday: 'Nächster Wochentag',
    openCalendar: 'Datumsauswahl öffnen',
    jumpToToday: 'Zu heute springen',
  },
  filters: {
    vegan: 'Vegan',
    vegetarian: 'Vegetarisch',
    favoritesOnly: 'Favoriten',
    filterPrefix: 'Filter',
  },
  menu: {
    defaultTitle: 'Mensa KA',
    selectCanteen: 'Mensa auswählen',
    selectPriceTier: 'Preiskategorie auswählen',
    offlineCache: (timestamp) => `Offline-Cache vom ${timestamp}.`,
    loadFailed: 'Speiseplan konnte nicht geladen werden.',
    noData: 'Keine Speiseplandaten verfügbar.',
    noMatchingMeals: 'Keine Gerichte passen zu den aktiven Filtern.',
  },
  favorites: {
    title: 'Favoriten',
    servedOn: (dateText) => `Angeboten am ${dateText}`,
    savedOtherDays: 'Für andere Tage gespeichert',
    lastSeen: (dateText) => `Zuletzt am ${dateText}`,
    emptyTitle: 'Noch keine Favoriten',
    emptyBody: 'Tippe im Speiseplan auf das Herz-Symbol, um Gerichte hier zu speichern.',
  },
  search: {
    title: 'Suche',
    placeholder: 'Gerichte oder Linien suchen',
    subtitleWithCanteen: (canteenName, dateText) => `${canteenName} · ${dateText}`,
    subtitleFallback: (dateText) => `Ergebnisse für ${dateText}`,
    noMatches: (query, canteenName) =>
      `Keine Gerichte für „${query}“${canteenName ? ` in ${canteenName}` : ''}`,
    noMeals: (canteenName) =>
      canteenName
        ? `Keine Gerichte für ${canteenName} geladen.`
        : 'Keine Gerichte für dieses Datum geladen.',
  },
  calendar: {
    title: 'Datum wählen',
    cancel: 'Abbrechen',
    applyAccessibility: 'Ausgewähltes Datum übernehmen',
    pickerTitle: 'Speiseplan-Datum',
    selectedDay: 'Gewählter Tag',
    applyButton: 'Datum übernehmen',
    nextWeekButton: '1 Woche vorspringen',
    todayButton: 'Zu heute springen',
  },
  mealDetail: {
    fallbackTitle: 'Gerichtdetails',
    loadFailed: 'Gerichtdetails konnten nicht geladen werden.',
    loadingDetails: 'Gerichtdetails werden geladen…',
    pricesTitle: 'Preise',
    nutritionTitle: 'Nährwerte',
    sidesTitle: 'Beilagen',
    allergensTitle: 'Allergene & Zusatzstoffe',
    environmentTitle: 'Umweltbilanz',
    statisticsTitle: 'Statistiken',
    nutrition: {
      energy: 'Energie',
      protein: 'Eiweiß',
      carbohydrates: 'Kohlenhydrate',
      sugar: 'Zucker',
      fat: 'Fett',
      saturatedFat: 'Gesättigte Fettsäuren',
      salt: 'Salz',
    },
    environment: {
      co2: 'CO₂-Emissionen',
      water: 'Wasserverbrauch',
    },
    statistics: {
      lastServed: 'Zuletzt angeboten',
      nextServed: 'Nächstes Angebot',
      timesServed: 'Häufigkeit (letzte 3 Monate)',
      firstTime: 'Erstmals',
      notScheduled: 'Nicht geplant',
    },
  },
  settings: {
    title: 'Einstellungen',
    sectionsTitle: 'Detailbereiche',
    sections: {
      defaults: 'Speiseplan-Standards',
      detailPage: 'Detailansicht',
      appearance: 'Darstellung',
      dataCache: 'API & Cache',
      about: 'Über',
    },
    rows: {
      canteen: 'Mensa',
      priceTier: 'Preiskategorie',
      skipWeekends: 'Wochenenden überspringen',
      sectionsAndOrder: 'Bereiche & Reihenfolge',
      theme: 'Design',
      language: 'Sprache',
      endpoint: 'API Endpoint',
      resetEndpoint: 'Auf api.mensa-ka.de zurücksetzen',
      clearCache: 'Offline-Cache leeren',
      clearingCache: 'Cache wird geleert…',
      version: 'Version',
      viewOnGithub: 'Auf GitHub ansehen',
    },
    cacheClearedTitle: 'Cache geleert',
    cacheClearedBody: 'Offline-Speisepläne und zwischengespeicherte Fotos wurden aktualisiert.',
    themes: {
      system: 'System',
      light: 'Hell',
      dark: 'Dunkel',
    },
    languages: {
      system: 'System',
      de: 'Deutsch',
      en: 'English',
    },
    detailEditor: {
      sectionTitle: 'Reihenfolge & Sichtbarkeit',
      footer:
        'Ziehe an den Griffen, um die Reihenfolge auf der Gerichtseite zu ändern, oder schalte Bereiche ein und aus.',
      resetAccessibility: 'Standardreihenfolge und Sichtbarkeit wiederherstellen',
    },
  },
  detailSections: {
    prices: 'Preise',
    nutrition: 'Nährwerte',
    sides: 'Beilagen',
    allergens: 'Allergene & Zusatzstoffe',
    environment: 'Umweltbilanz',
    statistics: 'Statistiken',
  },
  priceTiers: {
    student: 'Studierende',
    employee: 'Mitarbeitende',
    pupil: 'Schüler:innen',
    guest: 'Gäste',
  },
  mealTypes: {
    VEGAN: 'Vegan',
    VEGETARIAN: 'Vegetarisch',
    BEEF: 'Rind',
    BEEF_AW: 'Rind',
    PORK: 'Schwein',
    PORK_AW: 'Schwein',
    POULTRY: 'Geflügel',
    FISH: 'Fisch',
    UNKNOWN: 'Unbekannt',
  },
  ratings: {
    noRatings: 'Noch keine Bewertungen',
  },
  notFound: {
    title: 'Nicht gefunden',
    message: 'Diese Seite existiert nicht.',
    cta: 'Zurück zum Speiseplan',
  },
  lightbox: {
    share: 'Foto teilen',
    close: 'Fotoansicht schließen',
  },
};

export function getTranslations(language: AppLanguage): TranslationDictionary {
  return language === 'de' ? DE_TRANSLATIONS : EN_TRANSLATIONS;
}
