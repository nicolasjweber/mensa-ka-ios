import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radii, Spacing } from '@/constants/theme';
import { useMensa } from '@/store/MensaContext';

function SkeletonBlock({
  width,
  height,
  borderRadius = Radii.sm,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}) {
  const { palette } = useMensa();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [palette.skeletonStart, palette.skeletonEnd],
    ),
  }));

  return <Animated.View style={[{ width, height, borderRadius }, animatedStyle]} />;
}

function SkeletonMealRow() {
  const { palette } = useMensa();
  return (
    <View style={[styles.mealRow, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <SkeletonBlock width={92} height={92} borderRadius={Radii.sm} />
      <View style={styles.mealBody}>
        <SkeletonBlock width="88%" height={18} />
        <SkeletonBlock width="62%" height={14} />
        <View style={styles.mealFooter}>
          <SkeletonBlock width={68} height={22} borderRadius={Radii.pill} />
          <SkeletonBlock width={54} height={22} borderRadius={Radii.sm} />
        </View>
      </View>
    </View>
  );
}

export function MealSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1].map((cardIdx) => (
        <View key={cardIdx} style={styles.section}>
          <SkeletonBlock width={170} height={20} />
          <SkeletonMealRow />
          <SkeletonMealRow />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  mealBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
