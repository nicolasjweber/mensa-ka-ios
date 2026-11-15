import * as Haptics from 'expo-haptics';
import { NativeTabs } from 'expo-router/native-tabs';
import React from 'react';
import { Platform } from 'react-native';

import { IS_IPAD } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';

function onTabHaptic() {
  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync().catch(() => {});
  }
}

export default function TabsLayout() {
  const { palette, t } = useMensa();

  return (
    <NativeTabs sidebarAdaptable minimizeBehavior="onScrollDown" tintColor={palette.brand}>
      <NativeTabs.Trigger name="(menu)" listeners={{ tabPress: onTabHaptic }}>
        <NativeTabs.Trigger.Label>{t.tabs.menu}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorites" listeners={{ tabPress: onTabHaptic }}>
        <NativeTabs.Trigger.Label>{t.tabs.favorites}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md="favorite"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" listeners={{ tabPress: onTabHaptic }}>
        <NativeTabs.Trigger.Label>{t.tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="search"
        role="search"
        hidden={IS_IPAD}
        listeners={{ tabPress: onTabHaptic }}
      >
        <NativeTabs.Trigger.Label>{t.tabs.search}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
