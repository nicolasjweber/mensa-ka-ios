import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IS_IPAD } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';

export default function FavoritesTabStackLayout() {
  const { statusBarStyle, t } = useMensa();

  return (
    <Stack screenOptions={{ statusBarStyle }}>
      <Stack.Screen
        name="index"
        options={{
          title: t.favorites.title,
          headerLargeTitle: !IS_IPAD,
          headerTransparent: Platform.OS === 'ios',
        }}
      />
    </Stack>
  );
}
