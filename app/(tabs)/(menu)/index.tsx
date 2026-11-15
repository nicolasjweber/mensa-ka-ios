import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
  type SectionListData,
} from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

import { FilterBar } from '@/components/FilterBar';
import { MealCard } from '@/components/MealCard';
import { MealSkeleton } from '@/components/MealSkeleton';
import { ResponsiveGridRow } from '@/components/ResponsiveGridRow';
import { WeekStrip } from '@/components/WeekStrip';
import { Radii, Spacing } from '@/constants/theme';
import { chunkRows, IS_IPAD, useResponsiveLayout } from '@/lib/utils/layout';
import { filterLineMeals } from '@/lib/utils/meals';
import { useMensa } from '@/store/MensaContext';
import type { Meal, PriceTier } from '@/types/mensa';

interface MenuSection {
  id: string;
  title: string;
  totalMeals: number;
  data: Meal[][];
}

const PRICE_TIERS: PriceTier[] = ['student', 'employee', 'pupil', 'guest'];

export default function MenuScreen() {
  const router = useRouter();
  const {
    date,
    todayWeekday,
    shiftDate,
    goToToday,
    canteens,
    selectedCanteen,
    selectedCanteenId,
    setSelectedCanteenId,
    priceMode,
    setPriceMode,
    activeFilters,
    favoriteIds,
    palette,
    isLoading,
    isRefetching,
    error,
    dataUpdatedAt,
    refreshPlan,
    effectiveLanguage,
    t,
  } = useMensa();

  const [searchQuery, setSearchQuery] = useState('');
  const { columns, listPaddingLeft, listPaddingRight } = useResponsiveLayout();
  const lines = useMemo(() => selectedCanteen?.lines ?? [], [selectedCanteen]);
  const trimmedSearchQuery = IS_IPAD ? searchQuery.trim() : '';

  const sections: MenuSection[] = useMemo(() => {
    const result: MenuSection[] = [];
    for (const line of lines) {
      const meals = filterLineMeals(line, activeFilters, favoriteIds, trimmedSearchQuery);
      if (meals.length > 0) {
        result.push({
          id: line.id,
          title: line.name,
          totalMeals: meals.length,
          data: chunkRows(meals, columns),
        });
      }
    }
    return result;
  }, [lines, activeFilters, favoriteIds, columns, trimmedSearchQuery]);

  const swipeLeft = useMemo(
    () =>
      Gesture.Fling()
        .direction(Directions.LEFT)
        .runOnJS(true)
        .onEnd(() => {
          shiftDate(1);
        }),
    [shiftDate],
  );

  const swipeRight = useMemo(
    () =>
      Gesture.Fling()
        .direction(Directions.RIGHT)
        .runOnJS(true)
        .onEnd(() => {
          shiftDate(-1);
        }),
    [shiftDate],
  );

  const swipeGesture = useMemo(
    () => Gesture.Simultaneous(swipeLeft, swipeRight),
    [swipeLeft, swipeRight],
  );

  const statusBanner = useMemo(() => {
    if (!error) {
      return null;
    }
    if (canteens.length > 0 && dataUpdatedAt > 0) {
      const formattedTimestamp = new Date(dataUpdatedAt).toLocaleString(
        effectiveLanguage === 'de' ? 'de-DE' : 'en-US',
      );
      return {
        tone: 'warning' as const,
        text: t.menu.offlineCache(formattedTimestamp),
      };
    }
    return {
      tone: 'danger' as const,
      text: error.message || t.menu.loadFailed,
    };
  }, [canteens.length, dataUpdatedAt, effectiveLanguage, error, t]);

  const showTodayAction = date !== todayWeekday && !IS_IPAD;
  const screenTitle = selectedCanteen?.name ?? t.menu.defaultTitle;
  const screenOptions = useMemo(
    () => ({
      title: IS_IPAD ? '' : screenTitle,
      headerLargeTitle: !IS_IPAD,
      headerTransparent: Platform.OS === 'ios',
    }),
    [screenTitle],
  );

  return (
    <>
      <Stack.Screen options={screenOptions} />

      {IS_IPAD ? (
        <Stack.SearchBar
          placement="integrated"
          hideWhenScrolling={false}
          hideNavigationBar={false}
          obscureBackground={false}
          placeholder={t.search.placeholder}
          onChangeText={(event) => setSearchQuery(event.nativeEvent.text)}
          onCancelButtonPress={() => setSearchQuery('')}
        />
      ) : null}

      {showTodayAction ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            icon="arrow.counterclockwise"
            accessibilityLabel={t.weekStrip.jumpToToday}
            onPress={goToToday}
          />
        </Stack.Toolbar>
      ) : null}

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="building.2" accessibilityLabel={t.menu.selectCanteen}>
          {canteens.map((canteen) => (
            <Stack.Toolbar.MenuAction
              key={canteen.id}
              isOn={canteen.id === selectedCanteenId}
              onPress={() => setSelectedCanteenId(canteen.id)}
            >
              {canteen.name}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>

        <Stack.Toolbar.Menu icon="eurosign.circle" accessibilityLabel={t.menu.selectPriceTier}>
          {PRICE_TIERS.map((tier) => (
            <Stack.Toolbar.MenuAction
              key={tier}
              isOn={tier === priceMode}
              onPress={() => setPriceMode(tier)}
            >
              {t.priceTiers[tier]}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>

        <Stack.Toolbar.Button
          icon="calendar"
          accessibilityLabel={t.weekStrip.openCalendar}
          onPress={() => router.push('/calendar-modal')}
        />
      </Stack.Toolbar>

      <GestureDetector gesture={swipeGesture}>
        <SectionList<Meal[], MenuSection>
          sections={sections}
          keyExtractor={(row, index) => `${row[0]?.id ?? 'row'}-${index}`}
          contentInsetAdjustmentBehavior="automatic"
          stickySectionHeadersEnabled={false}
          style={{ flex: 1, backgroundColor: palette.canvas }}
          contentContainerStyle={[
            styles.listContent,
            { paddingLeft: listPaddingLeft, paddingRight: listPaddingRight },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refreshPlan();
              }}
              tintColor={palette.brand}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {IS_IPAD ? (
                <Text style={[styles.ipadPageTitle, { color: palette.text }]} numberOfLines={2}>
                  {screenTitle}
                </Text>
              ) : null}
              <WeekStrip />
              <FilterBar />
              {statusBanner ? (
                <View
                  style={[
                    styles.statusBanner,
                    {
                      backgroundColor: palette.surface,
                      borderColor:
                        statusBanner.tone === 'warning' ? palette.warning : palette.danger,
                    },
                  ]}
                >
                  <SymbolView
                    name="exclamationmark.triangle.fill"
                    size={15}
                    tintColor={statusBanner.tone === 'warning' ? palette.warning : palette.danger}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusBanner.tone === 'warning' ? palette.warning : palette.danger,
                      },
                    ]}
                  >
                    {statusBanner.text}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderSectionHeader={({ section }: { section: SectionListData<Meal[], MenuSection> }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={[styles.sectionAccent, { backgroundColor: palette.brand }]} />
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{section.title}</Text>
              </View>
              <View style={[styles.countPill, { backgroundColor: palette.surfaceSoft }]}>
                <Text style={[styles.countText, { color: palette.muted }]}>
                  {section.totalMeals} {section.totalMeals === 1 ? t.common.meal : t.common.meals}
                </Text>
              </View>
            </View>
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
            isLoading ? (
              <MealSkeleton />
            ) : (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: palette.surface, borderColor: palette.border },
                ]}
              >
                <SymbolView
                  name={trimmedSearchQuery ? 'magnifyingglass' : 'fork.knife.circle'}
                  size={32}
                  tintColor={palette.muted}
                />
                <Text style={[styles.emptyTitle, { color: palette.text }]}>
                  {canteens.length === 0
                    ? t.menu.noData
                    : trimmedSearchQuery
                      ? t.search.noMatches(trimmedSearchQuery, selectedCanteen?.name)
                      : t.menu.noMatchingMeals}
                </Text>
              </View>
            )
          }
        />
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  headerContainer: {
    gap: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  ipadPageTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: Radii.pill,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  countPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
