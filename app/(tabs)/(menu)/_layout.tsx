import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IS_IPAD } from '@/lib/utils/layout';

export default function MenuTabStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: IS_IPAD ? '' : 'Mensa KA',
          headerLargeTitle: !IS_IPAD,
          headerTransparent: Platform.OS === 'ios',
        }}
      />
    </Stack>
  );
}
