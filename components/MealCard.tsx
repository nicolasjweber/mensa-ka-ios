import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { formatEuroPrice, formatRatingLabel } from '@/lib/utils/format';
import { getMealImageUrls } from '@/lib/utils/meals';
import { useMensa } from '@/store/MensaContext';
import type { Meal } from '@/types/mensa';
import { MealTypeBadge } from './MealTypeBadge';

interface MealCardProps {
  meal: Meal;
  lineId: string;
  canteenName?: string;
  style?: StyleProp<ViewStyle>;
}

export function MealCard({ meal, lineId, canteenName, style }: MealCardProps) {
  const router = useRouter();
  const { date, effectiveLanguage, favoriteIds, palette, priceMode, t, toggleFavorite } =
    useMensa();

  const mealId = String(meal.id ?? '');
  const isFavorite = favoriteIds.has(mealId);
  const selectedPrice = meal.price?.[priceMode];
  const imageUrls = useMemo(() => getMealImageUrls(meal), [meal]);
  const showImage = imageUrls.length > 0 && selectedPrice !== 0;
  const ratingInfo = useMemo(
    () => formatRatingLabel(meal.ratings, effectiveLanguage),
    [effectiveLanguage, meal.ratings],
  );

  const handleOpenDetail = () => {
    router.push({
      pathname: '/meal/[id]',
      params: { id: mealId, lineId, date },
    });
  };

  const handleOpenLightbox = () => {
    if (imageUrls.length === 0) {
      return;
    }
    router.push({
      pathname: '/lightbox',
      params: {
        urls: JSON.stringify(imageUrls),
        index: '0',
        title: meal.name,
        lineId,
      },
    });
  };

  return (
    <Pressable
      onPress={handleOpenDetail}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      <View style={styles.layout}>
        {showImage ? (
          <Pressable
            onPress={handleOpenLightbox}
            accessibilityLabel={`${t.common.mealPhoto}: ${meal.name}`}
            style={styles.imageWrap}
          >
            <Image
              source={{ uri: imageUrls[0] }}
              cachePolicy="disk"
              contentFit="cover"
              transition={180}
              style={[styles.image, { backgroundColor: palette.surfaceSoft }]}
            />
            {imageUrls.length > 1 ? (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>{imageUrls.length}x</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        <View style={styles.content}>
          <View style={styles.head}>
            <View style={styles.titleBlock}>
              {canteenName ? (
                <Text style={[styles.canteenHint, { color: palette.muted }]} numberOfLines={1}>
                  {canteenName}
                </Text>
              ) : null}
              <Text style={[styles.name, { color: palette.text }]} numberOfLines={3}>
                {meal.name}
              </Text>
            </View>

            <Pressable
              onPress={() => toggleFavorite(meal)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`${t.tabs.favorites}: ${meal.name}`}
              accessibilityState={{ selected: isFavorite }}
              style={styles.favoriteBtn}
            >
              <SymbolView
                name={isFavorite ? 'heart.fill' : 'heart'}
                size={20}
                tintColor={isFavorite ? palette.favorite : palette.muted}
              />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={styles.metaLeft}>
              <MealTypeBadge mealType={meal.mealType} />
              <View style={styles.ratingRow}>
                {ratingInfo.hasRatings ? (
                  <SymbolView name="star.fill" size={13} tintColor={palette.starColor} />
                ) : null}
                <Text style={[styles.ratingText, { color: palette.muted }]}>{ratingInfo.label}</Text>
              </View>
            </View>

            <View style={[styles.pricePill, { backgroundColor: palette.brandSoft }]}>
              <Text style={[styles.priceText, { color: palette.brandDeep }]}>
                {formatEuroPrice(selectedPrice, effectiveLanguage)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  layout: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  imageWrap: {
    position: 'relative',
    width: 92,
    height: 92,
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(5, 16, 14, 0.78)',
    borderRadius: Radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  canteenHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  favoriteBtn: {
    padding: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
