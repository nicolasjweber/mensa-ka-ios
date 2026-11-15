import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import { Platform, SectionList, StyleSheet, Text, View } from 'react-native';

import { MealCard } from '@/components/MealCard';
import { ResponsiveGridRow } from '@/components/ResponsiveGridRow';
import { Radii, Spacing } from '@/constants/theme';
import { formatDateHeader } from '@/lib/utils/date';
import { chunkRows, IS_IPAD, useResponsiveLayout } from '@/lib/utils/layout';
import { filterLineMeals } from '@/lib/utils/meals';
import { useMensa } from '@/store/MensaContext';
import type { Meal } from '@/types/mensa';

interface SearchSection {
  id: string;
  title: string;
  data: Meal[][];
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { columns, listPaddingLeft, listPaddingRight } = useResponsiveLayout();
  const { activeFilters, date, effectiveLanguage, favoriteIds, palette, selectedCanteen, t } =
    useMensa();

  const normalizedQuery = query.trim().toLowerCase();

  const sections: SearchSection[] = useMemo(() => {
    if (!selectedCanteen) {
      return [];
    }
    const result: SearchSection[] = [];
    for (const line of selectedCanteen.lines) {
      const matches = filterLineMeals(line, activeFilters, favoriteIds, normalizedQuery);

      if (matches.length > 0) {
        result.push({
          id: line.id,
          title: line.name,
          data: chunkRows(matches, columns),
        });
      }
    }
    return result;
  }, [activeFilters, columns, favoriteIds, normalizedQuery, selectedCanteen]);

  return (
    <>
      <Stack.Screen
        options={{
          title: t.search.title,
          headerLargeTitle: !IS_IPAD,
          headerTransparent: Platform.OS === 'ios',
          headerSearchBarOptions: {
            placeholder: t.search.placeholder,
            hideWhenScrolling: false,
            onChangeText: (event) => setQuery(event.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
          },
        }}
      />

      <SectionList<Meal[], SearchSection>
        sections={sections}
        keyExtractor={(row, index) => `${row[0]?.id ?? 'row'}-${index}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        style={{ flex: 1, backgroundColor: palette.canvas }}
        contentContainerStyle={[
          styles.listContent,
          { paddingLeft: listPaddingLeft, paddingRight: listPaddingRight },
        ]}
        ListHeaderComponent={
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            {selectedCanteen
              ? t.search.subtitleWithCanteen(
                  selectedCanteen.name,
                  formatDateHeader(date, effectiveLanguage),
                )
              : t.search.subtitleFallback(formatDateHeader(date, effectiveLanguage))}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: palette.brandDeep }]}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => (
          <ResponsiveGridRow
            items={item}
            columns={columns}
            renderItem={(meal) => (
              <MealCard
                meal={meal}
                lineId={section.id}
              />
            )}
          />
        )}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          >
            <SymbolView name="magnifyingglass" size={30} tintColor={palette.muted} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              {normalizedQuery
                ? t.search.noMatches(query.trim(), selectedCanteen?.name)
                : t.search.noMeals(selectedCanteen?.name)}
            </Text>
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
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  emptyBox: {
    marginTop: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
