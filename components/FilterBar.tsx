import {
  Button,
  GlassEffectContainer,
  HStack,
  Host,
  Image as SwiftImage,
  Text as SwiftText,
} from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  lineLimit,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { useResponsiveLayout } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';
import type { ActiveFilters } from '@/types/mensa';
import { glassButtonModifiers, useLiquidGlassEnabled } from './GlassSurface';

interface FilterChipDef {
  key: keyof ActiveFilters;
  symbol: SFSymbol;
}

const FILTER_CHIPS: FilterChipDef[] = [
  { key: 'vegan', symbol: 'leaf.fill' },
  { key: 'vegetarian', symbol: 'carrot.fill' },
  { key: 'favoritesOnly', symbol: 'heart.fill' },
];

export function FilterBar() {
  const { activeFilters, effectiveScheme, toggleFilter, palette, t } = useMensa();
  const { isWide } = useResponsiveLayout();
  const liquidGlass = useLiquidGlassEnabled();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scrollView, isWide && styles.wideContainer]}
      contentContainerStyle={[styles.scrollContent, isWide && styles.wideScrollContent]}
    >
      <Host matchContents colorScheme={effectiveScheme} seedColor={palette.brand}>
        <GlassEffectContainer spacing={8}>
          <HStack spacing={8}>
            {FILTER_CHIPS.map((chip) => {
              const active = activeFilters[chip.key];
              const label = t.filters[chip.key];
              return (
                <Button
                  key={chip.key}
                  onPress={() => toggleFilter(chip.key)}
                  modifiers={glassButtonModifiers({
                    liquidGlass,
                    scheme: effectiveScheme,
                    brandColor: palette.brand,
                    shape: 'capsule',
                    tone: active ? 'active' : 'neutral',
                    accessibilityLabel: `${t.filters.filterPrefix}: ${label}`,
                  })}
                >
                  <HStack
                    spacing={6}
                    modifiers={[
                      padding(
                        liquidGlass
                          ? { horizontal: 14, vertical: 8 }
                          : { horizontal: 4, vertical: 2 },
                      ),
                    ]}
                  >
                    <SwiftImage
                      systemName={chip.symbol}
                      size={13}
                      color={active ? palette.brandInk : palette.brand}
                    />
                    <SwiftText
                      modifiers={[
                        font({ size: 13, weight: 'bold' }),
                        foregroundStyle(active ? palette.brandInk : palette.text),
                        lineLimit(1),
                      ]}
                    >
                      {label}
                    </SwiftText>
                  </HStack>
                </Button>
              );
            })}
          </HStack>
        </GlassEffectContainer>
      </Host>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginVertical: -6,
  },
  wideContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  wideScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
