import {
  Button,
  GlassEffectContainer,
  HStack,
  Host,
  Image as SwiftImage,
  Spacer,
  Text as SwiftText,
  VStack,
} from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  padding,
  textCase,
} from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { formatDateHeader, getWeekdaysForDate } from '@/lib/utils/date';
import { useResponsiveLayout } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';
import { glassButtonModifiers, useLiquidGlassEnabled } from './GlassSurface';

export function WeekStrip() {
  const router = useRouter();
  const { isWide } = useResponsiveLayout();
  const liquidGlass = useLiquidGlassEnabled();
  const {
    date,
    todayWeekday,
    setDate,
    shiftDate,
    goToToday,
    palette,
    effectiveLanguage,
    effectiveScheme,
    t,
  } = useMensa();

  const weekdays = useMemo(
    () => getWeekdaysForDate(date, effectiveLanguage),
    [date, effectiveLanguage],
  );
  const showTodayButton = date !== todayWeekday;

  return (
    <View style={[styles.wrapper, isWide && styles.wideWrapper]}>
      <Host
        matchContents={{ vertical: true, horizontal: false }}
        style={styles.host}
        colorScheme={effectiveScheme}
        seedColor={palette.brand}
      >
        <VStack
          alignment="center"
          spacing={Spacing.sm}
          modifiers={[padding({ horizontal: 6, vertical: 6 })]}
        >
          <GlassEffectContainer spacing={8}>
            <HStack alignment="center" spacing={Spacing.sm}>
              <Button
                onPress={() => shiftDate(-1)}
                modifiers={glassButtonModifiers({
                  liquidGlass,
                  scheme: effectiveScheme,
                  brandColor: palette.brand,
                  shape: 'circle',
                  accessibilityLabel: t.weekStrip.previousWeekday,
                })}
              >
                <SwiftImage
                  systemName="chevron.left"
                  size={14}
                  color={palette.text}
                  modifiers={[
                    frame(liquidGlass ? { width: 38, height: 38 } : { width: 20, height: 20 }),
                  ]}
                />
              </Button>

              <Spacer minLength={4} />

              <Button
                onPress={() => router.push('/calendar-modal')}
                modifiers={glassButtonModifiers({
                  liquidGlass,
                  scheme: effectiveScheme,
                  brandColor: palette.brand,
                  shape: 'capsule',
                  accessibilityLabel: t.weekStrip.openCalendar,
                })}
              >
                <HStack
                  spacing={6}
                  modifiers={[
                    padding(
                      liquidGlass
                        ? { horizontal: 14, vertical: 9 }
                        : { horizontal: 4, vertical: 2 },
                    ),
                  ]}
                >
                  <SwiftImage systemName="calendar" size={14} color={palette.brand} />
                  <SwiftText
                    modifiers={[
                      font({ size: 14, weight: 'bold' }),
                      foregroundStyle(palette.text),
                      lineLimit(1),
                    ]}
                  >
                    {formatDateHeader(date, effectiveLanguage)}
                  </SwiftText>
                  <SwiftImage systemName="chevron.down" size={11} color={palette.muted} />
                </HStack>
              </Button>

              {showTodayButton ? (
                <Button
                  onPress={goToToday}
                  modifiers={glassButtonModifiers({
                    liquidGlass,
                    scheme: effectiveScheme,
                    brandColor: palette.brand,
                    shape: 'capsule',
                    tone: 'accent',
                    accessibilityLabel: t.weekStrip.jumpToToday,
                  })}
                >
                  <HStack
                    spacing={4}
                    modifiers={[
                      padding(
                        liquidGlass
                          ? { horizontal: 12, vertical: 7 }
                          : { horizontal: 2, vertical: 2 },
                      ),
                    ]}
                  >
                    <SwiftImage systemName="arrow.counterclockwise" size={11} color={palette.brandDeep} />
                    <SwiftText
                      modifiers={[
                        font({ size: 12, weight: 'bold' }),
                        foregroundStyle(palette.brandDeep),
                        lineLimit(1),
                      ]}
                    >
                      {t.common.today}
                    </SwiftText>
                  </HStack>
                </Button>
              ) : null}

              <Spacer minLength={4} />

              <Button
                onPress={() => shiftDate(1)}
                modifiers={glassButtonModifiers({
                  liquidGlass,
                  scheme: effectiveScheme,
                  brandColor: palette.brand,
                  shape: 'circle',
                  accessibilityLabel: t.weekStrip.nextWeekday,
                })}
              >
                <SwiftImage
                  systemName="chevron.right"
                  size={14}
                  color={palette.text}
                  modifiers={[
                    frame(liquidGlass ? { width: 38, height: 38 } : { width: 20, height: 20 }),
                  ]}
                />
              </Button>
            </HStack>
          </GlassEffectContainer>

          <GlassEffectContainer spacing={8}>
            <HStack alignment="center" spacing={6}>
              {weekdays.map((item) => {
                const isSelected = item.dateStr === date;
                return (
                  <Button
                    key={item.dateStr}
                    onPress={() => {
                      if (!isSelected) {
                        setDate(item.dateStr);
                      }
                    }}
                    modifiers={glassButtonModifiers({
                      liquidGlass,
                      scheme: effectiveScheme,
                      brandColor: palette.brand,
                      shape: 'roundedRectangle',
                      cornerRadius: Radii.md,
                      tone: isSelected ? 'active' : 'neutral',
                      accessibilityLabel: `${item.dayShort}, ${item.dayNum} ${item.monthShort}${item.isToday ? ` (${t.common.today})` : ''}`,
                    })}
                  >
                    <VStack
                      alignment="center"
                      spacing={1}
                      modifiers={[
                        padding(
                          liquidGlass
                            ? { vertical: 9, horizontal: 4 }
                            : { vertical: 4, horizontal: 2 },
                        ),
                        frame({ maxWidth: Infinity }),
                      ]}
                    >
                      <SwiftText
                        modifiers={[
                          font({ size: 11, weight: 'bold' }),
                          textCase('uppercase'),
                          foregroundStyle(
                            isSelected
                              ? palette.brandInk
                              : item.isToday
                                ? palette.brand
                                : palette.muted,
                          ),
                          lineLimit(1),
                        ]}
                      >
                        {item.dayShort}
                      </SwiftText>
                      <SwiftText
                        modifiers={[
                          font({ size: 17, weight: 'heavy' }),
                          monospacedDigit(),
                          foregroundStyle(
                            isSelected
                              ? palette.brandInk
                              : item.isToday
                                ? palette.brand
                                : palette.text,
                          ),
                          lineLimit(1),
                        ]}
                      >
                        {item.dayNum}
                      </SwiftText>
                      <SwiftText
                        modifiers={[
                          font({ size: 10, weight: 'semibold' }),
                          foregroundStyle(
                            isSelected
                              ? palette.brandInk
                              : item.isToday
                                ? palette.brand
                                : palette.muted,
                          ),
                          lineLimit(1),
                        ]}
                      >
                        {item.isToday ? t.common.today : item.monthShort}
                      </SwiftText>
                    </VStack>
                  </Button>
                );
              })}
            </HStack>
          </GlassEffectContainer>
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: -6,
  },
  wideWrapper: {
    maxWidth: 720,
    alignSelf: 'center',
  },
  host: {
    width: '100%',
  },
});
