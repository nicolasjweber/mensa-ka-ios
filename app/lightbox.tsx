import { GlassContainer } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListViewToken,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/GlassSurface';
import { Radii, Spacing } from '@/constants/theme';
import { cleanLineName } from '@/lib/utils/meals';
import { useMensa } from '@/store/MensaContext';

const SPRING_CONFIG = { damping: 24, stiffness: 260, mass: 0.9 };
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

function ZoomablePhoto({
  uri,
  width,
  height,
  backdropAlpha,
  onToggleChrome,
  onZoomChange,
  onDismiss,
}: {
  uri: string;
  width: number;
  height: number;
  backdropAlpha: SharedValue<number>;
  onToggleChrome: () => void;
  onZoomChange: (zoomed: boolean) => void;
  onDismiss: () => void;
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const dragDismissY = useSharedValue(0);
  const isDismissing = useSharedValue(false);

  const reportZoomState = useCallback(
    (zoomed: boolean) => {
      setIsPhotoZoomed(zoomed);
      onZoomChange(zoomed);
    },
    [onZoomChange],
  );

  const resetTransform = () => {
    'worklet';
    scale.value = withSpring(1, SPRING_CONFIG);
    savedScale.value = 1;
    translateX.value = withSpring(0, SPRING_CONFIG);
    translateY.value = withSpring(0, SPRING_CONFIG);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    runOnJS(reportZoomState)(false);
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.value > 1.05) {
        resetTransform();
      } else {
        const targetScale = DOUBLE_TAP_SCALE;
        const maxX = (width * (targetScale - 1)) / 2;
        const maxY = (height * (targetScale - 1)) / 2;
        const focalX = (width / 2 - e.x) * (targetScale - 1);
        const focalY = (height / 2 - e.y) * (targetScale - 1);
        const nextX = clamp(focalX, -maxX, maxX);
        const nextY = clamp(focalY, -maxY, maxY);

        scale.value = withSpring(targetScale, SPRING_CONFIG);
        savedScale.value = targetScale;
        translateX.value = withSpring(nextX, SPRING_CONFIG);
        translateY.value = withSpring(nextY, SPRING_CONFIG);
        savedTranslateX.value = nextX;
        savedTranslateY.value = nextY;
        runOnJS(reportZoomState)(true);
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .requireExternalGestureToFail(doubleTap)
    .onEnd((_e, success) => {
      if (success) {
        runOnJS(onToggleChrome)();
      }
    });

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const nextScale = clamp(savedScale.value * e.scale, 0.9, MAX_SCALE);
      scale.value = nextScale;
    })
    .onEnd(() => {
      if (scale.value <= 1.05) {
        resetTransform();
      } else {
        const clampedScale = clamp(scale.value, 1, MAX_SCALE);
        scale.value = clampedScale;
        savedScale.value = clampedScale;
        const maxX = (width * (clampedScale - 1)) / 2;
        const maxY = (height * (clampedScale - 1)) / 2;
        const nextX = clamp(translateX.value, -maxX, maxX);
        const nextY = clamp(translateY.value, -maxY, maxY);
        translateX.value = withSpring(nextX, SPRING_CONFIG);
        translateY.value = withSpring(nextY, SPRING_CONFIG);
        savedTranslateX.value = nextX;
        savedTranslateY.value = nextY;
        runOnJS(reportZoomState)(true);
      }
    });

  const basePan = Gesture.Pan().minPointers(1).maxPointers(1);
  const configuredPan = isPhotoZoomed
    ? basePan
    : basePan.activeOffsetY(14).failOffsetX([-12, 12]);

  const pan = configuredPan
    .onUpdate((e) => {
      if (savedScale.value > 1.05) {
        const maxX = (width * (savedScale.value - 1)) / 2;
        const maxY = (height * (savedScale.value - 1)) / 2;
        translateX.value = clamp(savedTranslateX.value + e.translationX, -maxX, maxX);
        translateY.value = clamp(savedTranslateY.value + e.translationY, -maxY, maxY);
        return;
      }

      if (e.translationY > 0 || dragDismissY.value > 0) {
        const clampedY = Math.max(0, e.translationY);
        dragDismissY.value = clampedY;
        backdropAlpha.value = clamp(1 - clampedY / 320, 0.2, 1);
      }
    })
    .onEnd((e) => {
      if (savedScale.value > 1.05) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
        return;
      }

      const shouldDismiss =
        dragDismissY.value > 110 || (dragDismissY.value > 35 && e.velocityY > 650);
      if (shouldDismiss && !isDismissing.value) {
        isDismissing.value = true;
        backdropAlpha.value = withTiming(0, { duration: 180 });
        dragDismissY.value = withTiming(height * 0.45, { duration: 180 }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        });
      } else {
        dragDismissY.value = withSpring(0, SPRING_CONFIG);
        backdropAlpha.value = withTiming(1, { duration: 180 });
      }
    });

  const composed = Gesture.Simultaneous(doubleTap, singleTap, pinch, pan);

  const animatedStyle = useAnimatedStyle(() => {
    const dismissScale = interpolate(dragDismissY.value, [0, 320], [1, 0.82]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + dragDismissY.value },
        { scale: scale.value * dismissScale },
      ],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.slide, { width, height }, animatedStyle]}>
        {imageLoading ? (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : null}
        <Image
          source={{ uri }}
          cachePolicy="disk"
          contentFit="contain"
          transition={180}
          onLoadEnd={() => setImageLoading(false)}
          style={{ width, height }}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export default function LightboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { canteens, palette, t } = useMensa();
  const params = useLocalSearchParams<{
    urls?: string;
    index?: string;
    title?: string;
    lineId?: string;
    lineName?: string;
  }>();
  const listRef = useRef<FlatList<string>>(null);

  const urls: string[] = useMemo(() => {
    try {
      const parsed = JSON.parse(String(params.urls ?? '[]')) as unknown;
      return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : [];
    } catch {
      return [];
    }
  }, [params.urls]);

  const initialIndex = useMemo(() => {
    const parsed = Number.parseInt(String(params.index ?? '0'), 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed >= urls.length) {
      return 0;
    }
    return parsed;
  }, [params.index, urls.length]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const backdropAlpha = useSharedValue(1);
  const chromeAlpha = useSharedValue(1);

  const title = params.title ? String(params.title) : t.common.mealPhoto;
  const activeUrl = urls[activeIndex] ?? urls[0] ?? '';

  const lineName = useMemo(() => {
    const explicit = params.lineName ? cleanLineName(String(params.lineName).trim()) : '';
    if (explicit) {
      return explicit;
    }
    const targetLineId = params.lineId ? String(params.lineId).trim() : '';
    if (!targetLineId) {
      return '';
    }
    for (const canteen of canteens) {
      const match = canteen.lines.find((line) => line.id === targetLineId);
      if (match?.name) {
        return cleanLineName(match.name);
      }
    }
    return '';
  }, [canteens, params.lineId, params.lineName]);

  const toggleChrome = useCallback(() => {
    setChromeVisible((prev) => {
      const next = !prev;
      chromeAlpha.value = withTiming(next ? 1 : 0, { duration: 200 });
      return next;
    });
  }, [chromeAlpha]);

  const handleShare = async () => {
    if (!activeUrl) {
      return;
    }
    if (Platform.OS === 'ios') {
      void Haptics.selectionAsync().catch(() => {});
    }
    try {
      await Share.share({
        message: title,
        url: activeUrl,
      });
    } catch {
      // Ignore cancelled share sheet
    }
  };

  const handleJumpToIndex = (index: number) => {
    if (index < 0 || index >= urls.length) {
      return;
    }
    if (Platform.OS === 'ios') {
      void Haptics.selectionAsync().catch(() => {});
    }
    setActiveIndex(index);
    setIsZoomed(false);
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      if (viewableItems.length > 0 && typeof viewableItems[0]?.index === 'number') {
        setActiveIndex(viewableItems[0].index);
        setIsZoomed(false);
      }
    },
  ).current;

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 0, 0, ${backdropAlpha.value})`,
  }));

  const chromeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chromeAlpha.value * backdropAlpha.value,
  }));

  return (
    <Animated.View style={[styles.container, backdropStyle]}>
      <StatusBar style="light" hidden={!chromeVisible} animated />
      <Stack.Screen
        options={{
          statusBarStyle: 'light',
          statusBarHidden: !chromeVisible,
          statusBarAnimation: 'fade',
        }}
      />

      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[styles.headerContainer, { top: insets.top + Spacing.xs }, chromeAnimatedStyle]}
      >
        <View style={styles.headerActionsRow}>
          {urls.length > 1 ? (
            <GlassSurface
              colorScheme="dark"
              glassStyle="regular"
              fallbackColor="rgba(22, 28, 26, 0.85)"
              style={styles.counterPill}
            >
              <Text style={styles.counterText}>
                {activeIndex + 1} / {urls.length}
              </Text>
            </GlassSurface>
          ) : (
            <View />
          )}

          <GlassContainer spacing={8} style={styles.headerActions}>
            {activeUrl ? (
              <Pressable
                onPress={() => {
                  void handleShare();
                }}
                accessibilityRole="button"
                accessibilityLabel={t.lightbox.share}
              >
                <GlassSurface
                  colorScheme="dark"
                  isInteractive
                  glassStyle="regular"
                  fallbackColor="rgba(22, 28, 26, 0.85)"
                  style={styles.iconBtn}
                >
                  <SymbolView name="square.and.arrow.up" size={16} weight="semibold" tintColor="#ffffff" />
                </GlassSurface>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.lightbox.close}
            >
              <GlassSurface
                colorScheme="dark"
                isInteractive
                glassStyle="regular"
                fallbackColor="rgba(22, 28, 26, 0.85)"
                style={styles.iconBtn}
              >
                <SymbolView name="xmark" size={16} weight="bold" tintColor="#ffffff" />
              </GlassSurface>
            </Pressable>
          </GlassContainer>
        </View>

        <GlassSurface
          colorScheme="dark"
          glassStyle="regular"
          fallbackColor="rgba(22, 28, 26, 0.85)"
          style={styles.headerInfoCard}
        >
          {lineName ? (
            <View style={styles.lineChip}>
              <SymbolView name="fork.knife" size={12} tintColor={palette.brand} />
              <Text style={styles.lineChipText} numberOfLines={1}>
                {lineName}
              </Text>
            </View>
          ) : null}
          <Text style={styles.headerTitle}>{title}</Text>
        </GlassSurface>
      </Animated.View>

      <FlatList
        ref={listRef}
        data={urls}
        horizontal
        pagingEnabled
        scrollEnabled={!isZoomed}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <ZoomablePhoto
            uri={item}
            width={width}
            height={height}
            backdropAlpha={backdropAlpha}
            onToggleChrome={toggleChrome}
            onZoomChange={setIsZoomed}
            onDismiss={() => router.back()}
          />
        )}
      />

      {urls.length > 1 ? (
        <Animated.View
          pointerEvents={chromeVisible ? 'box-none' : 'none'}
          style={[
            styles.bottomBarWrap,
            { bottom: Math.max(insets.bottom, Spacing.sm) + Spacing.xs },
            chromeAnimatedStyle,
          ]}
        >
          <GlassSurface
            colorScheme="dark"
            glassStyle="regular"
            fallbackColor="rgba(22, 28, 26, 0.85)"
            style={styles.thumbStripContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbScroll}
              contentContainerStyle={styles.thumbStrip}
            >
              {urls.map((url, idx) => {
                const active = idx === activeIndex;
                return (
                  <Pressable
                    key={`${url}-${idx}`}
                    onPress={() => handleJumpToIndex(idx)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`View photo ${idx + 1} of ${urls.length}`}
                    style={[
                      styles.thumbFrame,
                      {
                        borderColor: active ? palette.brand : 'rgba(255, 255, 255, 0.2)',
                        opacity: active ? 1 : 0.65,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: url }}
                      cachePolicy="disk"
                      contentFit="cover"
                      style={styles.thumbImage}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassSurface>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    gap: Spacing.xs,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headerInfoCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 4,
  },
  lineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineChipText: {
    flexShrink: 1,
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 10,
  },
  thumbStripContainer: {
    height: 52,
    maxWidth: '100%',
    borderRadius: 15,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbScroll: {
    flexGrow: 0,
    height: 40,
  },
  thumbStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  thumbFrame: {
    width: 38,
    height: 38,
    borderRadius: 9,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
