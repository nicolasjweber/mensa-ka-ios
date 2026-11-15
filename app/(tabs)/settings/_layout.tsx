import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IS_IPAD } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';

export default function SettingsTabStackLayout() {
  const { t } = useMensa();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t.settings.title,
          headerLargeTitle: !IS_IPAD,
          headerTransparent: Platform.OS === 'ios',
        }}
      />
      <Stack.Screen
        name="detail-sections"
        options={{
          title: t.settings.sectionsTitle,
          headerLargeTitle: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTransparent: Platform.OS === 'ios',
        }}
      />
    </Stack>
  );
}
