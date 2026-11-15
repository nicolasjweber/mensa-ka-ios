import { getTranslations } from '@/constants/i18n';
import type { AppLanguage, PriceTier, Ratings } from '@/types/mensa';

const EURO_FORMATTERS: Record<AppLanguage, Intl.NumberFormat | null> = {
  en: (() => {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });
    } catch {
      return null;
    }
  })(),
  de: (() => {
    try {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
    } catch {
      return null;
    }
  })(),
};

export function formatEuroPrice(
  cents: number | null | undefined,
  language: AppLanguage = 'en',
): string {
  if (typeof cents !== 'number' || Number.isNaN(cents)) {
    return '-';
  }
  const euros = cents / 100;
  const formatter = EURO_FORMATTERS[language];
  if (formatter) {
    try {
      return formatter.format(euros);
    } catch {
      // Fallback below
    }
  }
  return language === 'de' ? `${euros.toFixed(2).replace('.', ',')} €` : `€${euros.toFixed(2)}`;
}

export function formatRatingLabel(
  ratings: Ratings | null | undefined,
  language: AppLanguage = 'en',
): {
  hasRatings: boolean;
  label: string;
  clampedAverage: number;
} {
  const average = ratings?.averageRating;
  const count = ratings?.ratingsCount;

  if (typeof average !== 'number' || typeof count !== 'number' || count <= 0) {
    return {
      hasRatings: false,
      label: getTranslations(language).ratings.noRatings,
      clampedAverage: 0,
    };
  }

  const clampedAverage = Math.min(5, Math.max(0, average));
  const avgText =
    language === 'de'
      ? clampedAverage.toFixed(1).replace('.', ',')
      : clampedAverage.toFixed(1);
  return {
    hasRatings: true,
    label: `${avgText}/5 (${count})`,
    clampedAverage,
  };
}

export const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  student: 'Student',
  employee: 'Employee',
  pupil: 'Pupil',
  guest: 'Guest',
};
