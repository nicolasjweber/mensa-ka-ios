import { useIsRestoring } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { asyncStoragePersister, queryClient } from '@/lib/query/queryClient';
import { MensaProvider, useMensa } from '@/store/MensaContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { effectiveScheme, isHydrated, palette, t } = useMensa();
  const isRestoring = useIsRestoring();
  const isReady = isHydrated && !isRestoring;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  const navigationTheme =
    effectiveScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: palette.brand,
            background: palette.canvas,
            card: palette.surface,
            text: palette.text,
            border: palette.border,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: palette.brand,
            background: palette.canvas,
            card: palette.surface,
            text: palette.text,
            border: palette.border,
          },
        };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ statusBarStyle: effectiveScheme === 'dark' ? 'light' : 'dark' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="calendar-modal"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.72, 0.92],
            sheetGrabberVisible: true,
            title: t.calendar.title,
          }}
        />
        <Stack.Screen
          name="meal/[id]"
          options={{
            title: t.mealDetail.fallbackTitle,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="lightbox"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade',
            statusBarStyle: 'light',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <MensaProvider>
          <RootNavigator />
        </MensaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
