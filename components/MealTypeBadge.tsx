import { SymbolView } from 'expo-symbols';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getMealTypeColors, Radii, Spacing } from '@/constants/theme';
import { getMealTypeSymbol, humanMealType } from '@/lib/utils/meals';
import { useMensa } from '@/store/MensaContext';
import type { FoodType } from '@/types/mensa';

interface MealTypeBadgeProps {
  mealType: FoodType;
}

export function MealTypeBadge({ mealType }: MealTypeBadgeProps) {
  const { effectiveLanguage, palette } = useMensa();
  const colors = getMealTypeColors(mealType, palette);
  const label = humanMealType(mealType, effectiveLanguage);

  if (!colors || !mealType || mealType === 'UNKNOWN') {
    return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <SymbolView name={getMealTypeSymbol(mealType)} size={12} tintColor={colors.fg} />
      <Text style={[styles.label, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
