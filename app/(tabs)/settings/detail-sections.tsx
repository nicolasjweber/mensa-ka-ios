import { Host, List, Section, Text as SwiftText, Toggle } from '@expo/ui/swift-ui';
import { environment } from '@expo/ui/swift-ui/modifiers';
import { Stack } from 'expo-router';
import React from 'react';

import { DETAIL_SECTION_META, moveArrayItems } from '@/constants/detailSections';
import { useMensa } from '@/store/MensaContext';

export default function DetailSectionsSettingsScreen() {
  const {
    detailSections,
    detailSectionOrder,
    effectiveScheme,
    palette,
    resetDetailLayout,
    setDetailSectionOrder,
    setDetailSectionVisible,
    t,
  } = useMensa();

  const handleMove = (sourceIndices: number[], destination: number) => {
    const nextOrder = moveArrayItems(detailSectionOrder, sourceIndices, destination);
    setDetailSectionOrder(nextOrder);
  };

  return (
    <>
      <Stack.Screen options={{ title: t.settings.sectionsTitle }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="arrow.counterclockwise"
          accessibilityLabel={t.settings.detailEditor.resetAccessibility}
          onPress={resetDetailLayout}
        />
      </Stack.Toolbar>

      <Host
        style={{ flex: 1, backgroundColor: palette.canvas }}
        colorScheme={effectiveScheme}
        seedColor={palette.brand}
      >
        <List modifiers={[environment('editMode', 'active')]}>
          <Section
            title={t.settings.detailEditor.sectionTitle}
            footer={<SwiftText>{t.settings.detailEditor.footer}</SwiftText>}
          >
            <List.ForEach
              data={detailSectionOrder}
              keyExtractor={(key) => key}
              recycling={false}
              onMove={handleMove}
            >
              {({ item: key }) => {
                const meta = DETAIL_SECTION_META[key];
                return (
                  <Toggle
                    isOn={detailSections[key]}
                    onIsOnChange={(next) => setDetailSectionVisible(key, next)}
                    label={t.detailSections[key]}
                    systemImage={meta.systemImage}
                  />
                );
              }}
            </List.ForEach>
          </Section>
        </List>
      </Host>
    </>
  );
}
