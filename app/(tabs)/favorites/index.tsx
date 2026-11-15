import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { MealCard } from '@/components/MealCard';
import { MealTypeBadge } from '@/components/MealTypeBadge';
import { ResponsiveGridRow } from '@/components/ResponsiveGridRow';
import { Radii, Spacing } from '@/constants/theme';
import { formatDateHeader } from '@/lib/utils/date';
import { chunkRows, IS_IPAD, useResponsiveLayout } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';
import type { FavoriteSnapshot, Meal } from '@/types/mensa';

type FavoriteEntry =
  | { kind: 'live'; meal: Meal; lineId: string; canteenName: string }
  | { kind: 'snapshot'; snapshot: FavoriteSnapshot };

interface FavoriteSection {
  title: string;
  data: FavoriteEntry[][];
}

export default function FavoritesScreen() {
  const {
    canteens,
    date,
    effectiveLanguage,
    favoriteIds,
    favorites,
    palette,
    removeFavoriteById,
    selectedCanteen,
    t,
  } = useMensa();

  const { columns, listPaddingLeft, listPaddingRight } = useResponsiveLayout();

  const sections: FavoriteSection[] = useMemo(() => {
    const liveItems: FavoriteEntry[] = [];
    const matchedIds = new Set<string>();

    const orderedCanteens = selectedCanteen
      ? [selectedCanteen, ...canteens.filter((c) => c.id !== selectedCanteen.id)]
      : canteens;

    for (const canteen of orderedCanteens) {
      for (const line of canteen.lines) {
        for (const meal of line.meals ?? []) {
          const id = String(meal.id ?? '');
          if (favoriteIds.has(id) && !matchedIds.has(id)) {
            matchedIds.add(id);
            liveItems.push({
              kind: 'live',
              meal,
              lineId: line.id,
              canteenName: `${canteen.name} · ${line.name}`,
            });
          }
        }
      }
    }

    const offlineSnapshots: FavoriteEntry[] = Object.values(favorites)
      .filter((snap) => !matchedIds.has(snap.id))
      .map((snapshot) => ({ kind: 'snapshot', snapshot }));

    const result: FavoriteSection[] = [];
    if (liveItems.length > 0) {
      result.push({
        title: t.favorites.servedOn(formatDateHeader(date, effectiveLanguage)),
        data: chunkRows(liveItems, columns),
      });
    }
    if (offlineSnapshots.length > 0) {
      result.push({
        title: t.favorites.savedOtherDays,
        data: chunkRows(offlineSnapshots, columns),
      });
    }
    return result;
  }, [canteens, columns, date, effectiveLanguage, favoriteIds, favorites, selectedCanteen, t]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t.favorites.title,
          headerLargeTitle: !IS_IPAD,
        }}
      />

      <SectionList<FavoriteEntry[], FavoriteSection>
        sections={sections}
        keyExtractor={(row, index) => {
          const first = row[0];
          if (!first) {
            return `row-${index}`;
          }
          return first.kind === 'live'
            ? `live-${first.meal.id}-${index}`
            : `snap-${first.snapshot.id}-${index}`;
        }}
        contentInsetAdjustmentBehavior="automatic"
        stickySectionHeadersEnabled={false}
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={[
          styles.listContent,
          { paddingLeft: listPaddingLeft, paddingRight: listPaddingRight },
        ]}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: palette.muted }]}>{section.title}</Text>
        )}
        renderItem={({ item: row }) => (
          <ResponsiveGridRow
            items={row}
            columns={columns}
            renderItem={(entry) => {
              if (entry.kind === 'live') {
                return (
                  <MealCard
                    meal={entry.meal}
                    lineId={entry.lineId}
                    canteenName={entry.canteenName}
                  />
                );
              }

              const { snapshot } = entry;
              return (
                <View
                  style={[
                    styles.snapshotCard,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                >
                  {snapshot.imageUrl ? (
                    <Image
                      source={{ uri: snapshot.imageUrl }}
                      cachePolicy="disk"
                      contentFit="cover"
                      style={[styles.snapshotImg, { backgroundColor: palette.surfaceSoft }]}
                    />
                  ) : null}
                  <View style={styles.snapshotBody}>
                    <Text style={[styles.snapshotName, { color: palette.text }]} numberOfLines={2}>
                      {snapshot.name}
                    </Text>
                    <View style={styles.snapshotMeta}>
                      <MealTypeBadge mealType={snapshot.mealType} />
                      <Text style={[styles.snapshotDate, { color: palette.muted }]}>
                        {t.favorites.lastSeen(formatDateHeader(snapshot.lastSeenDate, effectiveLanguage))}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => removeFavoriteById(snapshot.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.tabs.favorites}: ${snapshot.name}`}
                  >
                    <SymbolView name="heart.fill" size={20} tintColor={palette.favorite} />
                  </Pressable>
                </View>
              );
            }}
          />
        )}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <SymbolView name="heart.slash" size={34} tintColor={palette.muted} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>{t.favorites.emptyTitle}</Text>
            <Text style={[styles.emptyBody, { color: palette.muted }]}>{t.favorites.emptyBody}</Text>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  snapshotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  snapshotImg: {
    width: 64,
    height: 64,
    borderRadius: Radii.sm,
  },
  snapshotBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  snapshotName: {
    fontSize: 15,
    fontWeight: '700',
  },
  snapshotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  snapshotDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    marginTop: Spacing.xl,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
