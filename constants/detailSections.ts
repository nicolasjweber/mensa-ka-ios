import type { SFSymbol } from 'sf-symbols-typescript';
import type { MealDetailSectionKey } from '@/types/mensa';

export const DEFAULT_DETAIL_SECTION_ORDER: MealDetailSectionKey[] = [
  'prices',
  'nutrition',
  'sides',
  'allergens',
  'environment',
  'statistics',
];

export const DETAIL_SECTION_META: Record<
  MealDetailSectionKey,
  { label: string; systemImage: SFSymbol }
> = {
  prices: { label: 'Prices', systemImage: 'eurosign.circle' },
  nutrition: { label: 'Nutrition Facts', systemImage: 'chart.bar' },
  sides: { label: 'Included Sides', systemImage: 'fork.knife' },
  allergens: { label: 'Allergens & Additives', systemImage: 'exclamationmark.triangle' },
  environment: { label: 'Environmental Impact', systemImage: 'leaf' },
  statistics: { label: 'Meal Statistics', systemImage: 'clock.arrow.circlepath' },
};

/**
 * Applies SwiftUI `onMove(fromOffsets:toOffset:)` index semantics to an array.
 */
export function moveArrayItems<T>(
  items: readonly T[],
  sourceIndices: number[],
  destination: number,
): T[] {
  const indexSet = new Set(sourceIndices);
  const moved = sourceIndices
    .slice()
    .sort((a, b) => a - b)
    .map((i) => items[i])
    .filter((item): item is T => item !== undefined);
  const remaining = items.filter((_, idx) => !indexSet.has(idx));
  const removedBeforeDest = sourceIndices.filter((i) => i < destination).length;
  const insertAt = Math.max(0, Math.min(remaining.length, destination - removedBeforeDest));
  return [...remaining.slice(0, insertAt), ...moved, ...remaining.slice(insertAt)];
}
