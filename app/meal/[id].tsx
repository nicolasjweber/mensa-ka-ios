import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MealTypeBadge } from '@/components/MealTypeBadge';
import { Radii, Spacing } from '@/constants/theme';
import { fetchMealDetail } from '@/lib/api/client';
import { formatDateHeader } from '@/lib/utils/date';
import { formatEuroPrice, formatRatingLabel } from '@/lib/utils/format';
import { useResponsiveLayout } from '@/lib/utils/layout';
import {
  getAdditiveLabel,
  getAllergenLabel,
  getMealImageUrls,
} from '@/lib/utils/meals';
import { useMensa } from '@/store/MensaContext';
import type { Meal, MealDetailSectionKey, PriceTier } from '@/types/mensa';

const PRICE_TIERS: PriceTier[] = ['student', 'employee', 'pupil', 'guest'];

export default function MealDetailScreen() {
  const router = useRouter();
  const { isWide, detailPaddingLeft, detailPaddingRight } = useResponsiveLayout();
  const params = useLocalSearchParams<{ id?: string; lineId?: string; date?: string }>();
  const mealId = String(params.id ?? '');
  const lineId = String(params.lineId ?? '');

  const {
    canteens,
    customApiUrl,
    date: contextDate,
    detailSectionOrder,
    detailSections,
    effectiveLanguage,
    favoriteIds,
    palette,
    priceMode,
    t,
    toggleFavorite,
  } = useMensa();

  const targetDate = String(params.date ?? contextDate);

  const cachedMatch = useMemo(() => {
    for (const canteen of canteens) {
      for (const line of canteen.lines) {
        if (lineId && line.id !== lineId) {
          continue;
        }
        const found = (line.meals ?? []).find((m) => String(m.id) === mealId);
        if (found) {
          return { meal: found, lineName: line.name, canteenName: canteen.name };
        }
      }
    }
    return null;
  }, [canteens, lineId, mealId]);

  const detailQuery = useQuery({
    queryKey: ['mealDetail', mealId, lineId, targetDate, customApiUrl ?? 'default'],
    queryFn: () => fetchMealDetail({ date: targetDate, mealId, lineId }, { customApiUrl }),
    enabled: Boolean(mealId && lineId && targetDate),
  });

  const meal: Meal | null = detailQuery.data ?? cachedMatch?.meal ?? null;
  const isFavorite = meal ? favoriteIds.has(String(meal.id)) : false;
  const imageUrls = useMemo(() => getMealImageUrls(meal), [meal]);
  const ratingInfo = useMemo(
    () => formatRatingLabel(meal?.ratings, effectiveLanguage),
    [effectiveLanguage, meal?.ratings],
  );

  if (!meal) {
    return (
      <>
        <Stack.Screen options={{ title: t.mealDetail.fallbackTitle }} />
        <View style={[styles.centered, { backgroundColor: palette.canvas }]}>
          {detailQuery.isLoading ? (
            <ActivityIndicator color={palette.brand} size="large" />
          ) : (
            <Text style={[styles.emptyText, { color: palette.muted }]}>
              {t.mealDetail.loadFailed}
            </Text>
          )}
        </View>
      </>
    );
  }

  const nutrition = meal.nutritionData;
  const env = meal.environmentInfo;
  const stats = meal.statistics;
  const allergens = meal.allergens ?? [];
  const additives = meal.additives ?? [];
  const sides = meal.sides ?? [];
  const wantsDetailEnrichment =
    detailSections.statistics ||
    detailSections.environment ||
    detailSections.nutrition ||
    detailSections.allergens;

  const formatDecimal = (value: number, fractionDigits = 1) =>
    new Intl.NumberFormat(effectiveLanguage === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);

  const renderDetailSection = (sectionKey: MealDetailSectionKey): React.ReactNode => {
    if (!detailSections[sectionKey]) {
      return null;
    }

    switch (sectionKey) {
      case 'prices':
        return (
          <View
            key="prices"
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t.mealDetail.pricesTitle}
            </Text>
            <View style={styles.priceGrid}>
              {PRICE_TIERS.map((tier) => {
                const active = tier === priceMode;
                return (
                  <View
                    key={tier}
                    style={[
                      styles.priceTile,
                      {
                        backgroundColor: active ? palette.brandSoft : palette.surfaceSoft,
                        borderColor: active ? palette.brand : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceTierLabel,
                        { color: active ? palette.brandDeep : palette.muted },
                      ]}
                    >
                      {t.priceTiers[tier]}
                    </Text>
                    <Text style={[styles.priceValue, { color: palette.text }]}>
                      {formatEuroPrice(meal.price?.[tier], effectiveLanguage)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'nutrition':
        if (!nutrition) {
          return null;
        }
        return (
          <View
            key="nutrition"
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t.mealDetail.nutritionTitle}
            </Text>
            <View style={styles.nutritionRows}>
              {[
                [t.mealDetail.nutrition.energy, `${nutrition.energy} kcal`],
                [t.mealDetail.nutrition.protein, `${nutrition.protein} g`],
                [t.mealDetail.nutrition.carbohydrates, `${nutrition.carbohydrates} g`],
                [t.mealDetail.nutrition.sugar, `${nutrition.sugar} g`],
                [t.mealDetail.nutrition.fat, `${nutrition.fat} g`],
                [t.mealDetail.nutrition.saturatedFat, `${nutrition.saturatedFat} g`],
                [t.mealDetail.nutrition.salt, `${nutrition.salt} g`],
              ].map(([label, val]) => (
                <View
                  key={label}
                  style={[styles.nutritionRow, { borderBottomColor: palette.border }]}
                >
                  <Text style={[styles.nutritionLabel, { color: palette.muted }]}>{label}</Text>
                  <Text style={[styles.nutritionValue, { color: palette.text }]}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'sides':
        if (sides.length === 0) {
          return null;
        }
        return (
          <View
            key="sides"
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t.mealDetail.sidesTitle}
            </Text>
            <View style={styles.sidesList}>
              {sides.map((side) => (
                <View key={side.id} style={styles.sideRow}>
                  <Text style={[styles.sideName, { color: palette.text }]}>{side.name}</Text>
                  <Text style={[styles.sidePrice, { color: palette.brandDeep }]}>
                    {formatEuroPrice(side.price?.[priceMode], effectiveLanguage)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'allergens':
        if (allergens.length === 0 && additives.length === 0) {
          return null;
        }
        return (
          <View
            key="allergens"
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t.mealDetail.allergensTitle}
            </Text>
            <View style={styles.chipWrap}>
              {allergens.map((code) => (
                <View key={`alg-${code}`} style={[styles.tagChip, { backgroundColor: palette.surfaceSoft }]}>
                  <Text style={[styles.tagChipText, { color: palette.text }]}>
                    {getAllergenLabel(code, effectiveLanguage)}
                  </Text>
                </View>
              ))}
              {additives.map((code) => (
                <View key={`add-${code}`} style={[styles.tagChip, { backgroundColor: palette.surfaceSoft }]}>
                  <Text style={[styles.tagChipText, { color: palette.muted }]}>
                    {getAdditiveLabel(code, effectiveLanguage)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'environment':
        if (!env) {
          return null;
        }
        return (
          <View
            key="environment"
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {t.mealDetail.environmentTitle}
            </Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statTile, { backgroundColor: palette.surfaceSoft }]}>
                <SymbolView name="leaf.fill" size={15} tintColor={palette.brand} />
                <Text style={[styles.statLabel, { color: palette.muted }]}>
                  {t.mealDetail.environment.co2}
                </Text>
                <Text style={[styles.statValue, { color: palette.text }]}>
                  {env.co2Value} g ({env.co2Rating}/{env.maxRating})
                </Text>
              </View>
              <View style={[styles.statTile, { backgroundColor: palette.surfaceSoft }]}>
                <SymbolView name="drop.fill" size={15} tintColor={palette.brand} />
                <Text style={[styles.statLabel, { color: palette.muted }]}>
                  {t.mealDetail.environment.water}
                </Text>
                <Text style={[styles.statValue, { color: palette.text }]}>
                  {formatDecimal(env.waterValue / 1000)} L ({env.waterRating}/{env.maxRating})
                </Text>
              </View>
            </View>
          </View>
        );

      case 'statistics':
        if (!stats) {
          return null;
        }
        return (
          <View
            key="statistics"
            style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>
                {t.mealDetail.statisticsTitle}
              </Text>
              {stats.new ? (
                <View style={[styles.newBadge, { backgroundColor: palette.brandSoft }]}>
                  <SymbolView name="sparkles" size={12} tintColor={palette.brandDeep} />
                  <Text style={[styles.newBadgeText, { color: palette.brandDeep }]}>{t.common.new}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.nutritionRows}>
              {[
                [
                  t.mealDetail.statistics.lastServed,
                  stats.lastServed
                    ? formatDateHeader(stats.lastServed.slice(0, 10), effectiveLanguage)
                    : t.mealDetail.statistics.firstTime,
                ],
                [
                  t.mealDetail.statistics.nextServed,
                  stats.nextServed
                    ? formatDateHeader(stats.nextServed.slice(0, 10), effectiveLanguage)
                    : t.mealDetail.statistics.notScheduled,
                ],
                [t.mealDetail.statistics.timesServed, `${stats.frequency}×`],
              ].map(([label, val], idx, arr) => (
                <View
                  key={label}
                  style={[
                    styles.nutritionRow,
                    {
                      borderBottomColor: palette.border,
                      borderBottomWidth: idx === arr.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <Text style={[styles.nutritionLabel, { color: palette.muted }]}>{label}</Text>
                  <Text style={[styles.nutritionValue, { color: palette.text }]}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        );
    }
  };

  const renderGalleryItem = (
    url: string,
    idx: number,
    variant: 'narrow' | 'single' | 'twoUp' | 'scroll',
  ) => {
    const pressableStyle =
      variant === 'single'
        ? styles.wideSinglePress
        : variant === 'twoUp'
          ? styles.wideTwoUpPress
          : undefined;
    const sizeStyle =
      variant === 'single'
        ? styles.heroImageWideSingle
        : variant === 'twoUp'
          ? styles.heroImageWideTwoUp
          : variant === 'scroll'
            ? styles.heroImageWide
            : styles.heroImageNarrow;

    return (
      <Pressable
        key={url}
        style={pressableStyle}
        onPress={() =>
          router.push({
            pathname: '/lightbox',
            params: {
              urls: JSON.stringify(imageUrls),
              index: String(idx),
              title: meal.name,
              lineId,
              lineName: cachedMatch?.lineName ?? '',
            },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`${t.common.mealPhoto} ${idx + 1} / ${imageUrls.length}`}
      >
        <Image
          source={{ uri: url }}
          cachePolicy="disk"
          contentFit="cover"
          style={[styles.heroImage, sizeStyle, { backgroundColor: palette.surfaceSoft }]}
        />
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: meal.name }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isFavorite ? 'heart.fill' : 'heart'}
          tintColor={isFavorite ? palette.favorite : undefined}
          accessibilityLabel={t.tabs.favorites}
          onPress={() => toggleFavorite(meal)}
        />
      </Stack.Toolbar>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={[
          styles.container,
          { paddingLeft: detailPaddingLeft, paddingRight: detailPaddingRight },
        ]}
      >
        {imageUrls.length > 0 ? (
          isWide && imageUrls.length === 1 ? (
            renderGalleryItem(imageUrls[0], 0, 'single')
          ) : isWide && imageUrls.length === 2 ? (
            <View style={styles.wideTwoUpRow}>
              {imageUrls.map((url, idx) => renderGalleryItem(url, idx, 'twoUp'))}
            </View>
          ) : isWide ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.galleryWide}
              contentContainerStyle={styles.galleryContentWide}
            >
              {imageUrls.map((url, idx) => renderGalleryItem(url, idx, 'scroll'))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={[
                styles.gallery,
                { marginLeft: -detailPaddingLeft, marginRight: -detailPaddingRight },
              ]}
              contentContainerStyle={[
                styles.galleryContent,
                { paddingLeft: detailPaddingLeft, paddingRight: detailPaddingRight },
              ]}
            >
              {imageUrls.map((url, idx) => renderGalleryItem(url, idx, 'narrow'))}
            </ScrollView>
          )
        ) : null}

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          {cachedMatch ? (
            <Text style={[styles.locationLabel, { color: palette.brandDeep }]}>
              {cachedMatch.canteenName} · {cachedMatch.lineName}
            </Text>
          ) : null}
          <Text style={[styles.title, { color: palette.text }]}>{meal.name}</Text>

          <View style={styles.metaRow}>
            <MealTypeBadge mealType={meal.mealType} />
            <View style={styles.ratingRow}>
              {ratingInfo.hasRatings ? (
                <SymbolView name="star.fill" size={14} tintColor={palette.starColor} />
              ) : null}
              <Text style={[styles.ratingText, { color: palette.muted }]}>{ratingInfo.label}</Text>
            </View>
          </View>
        </View>

        {wantsDetailEnrichment && detailQuery.isLoading && !nutrition && !env && !stats ? (
          <View style={styles.enrichLoading}>
            <ActivityIndicator color={palette.brand} />
            <Text style={[styles.enrichText, { color: palette.muted }]}>
              {t.mealDetail.loadingDetails}
            </Text>
          </View>
        ) : null}

        {detailSectionOrder.map((sectionKey) => renderDetailSection(sectionKey))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  gallery: {
    marginHorizontal: -Spacing.lg,
  },
  galleryContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  galleryWide: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  galleryContentWide: {
    gap: Spacing.sm,
  },
  wideSinglePress: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
  },
  wideTwoUpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  wideTwoUpPress: {
    flex: 1,
  },
  heroImage: {
    borderRadius: Radii.lg,
  },
  heroImageNarrow: {
    width: 300,
    height: 210,
  },
  heroImageWide: {
    width: 356,
    height: 238,
  },
  heroImageWideSingle: {
    width: '100%',
    aspectRatio: 3 / 2,
  },
  heroImageWideTwoUp: {
    width: '100%',
    aspectRatio: 3 / 2,
  },
  card: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priceTile: {
    width: '48.5%',
    borderRadius: Radii.sm,
    borderWidth: 1.5,
    padding: Spacing.md,
    gap: 2,
  },
  priceTierLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  enrichLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  enrichText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statTile: {
    flex: 1,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  nutritionRows: {
    gap: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sidesList: {
    gap: Spacing.xs,
  },
  sideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  sideName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  sidePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
