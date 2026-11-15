import {
  Button,
  Form,
  Host,
  HStack,
  Image as SwiftImage,
  Label,
  LabeledContent,
  Picker,
  Section,
  Text as SwiftText,
  Toggle,
} from '@expo/ui/swift-ui';
import {
  foregroundStyle,
  labelsHidden,
  lineLimit,
  pickerStyle,
  tag,
  tint,
  truncationMode,
} from '@expo/ui/swift-ui/modifiers';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert } from 'react-native';

import { DEFAULT_API_URL, resolveApiUrl } from '@/lib/api/client';
import { IS_IPAD } from '@/lib/utils/layout';
import { useMensa } from '@/store/MensaContext';
import type { LanguagePreference, PriceTier, ThemePreference } from '@/types/mensa';

const GITHUB_URL = 'https://github.com/nicolasjweber/mensa-ka-ios';
const PRICE_TIERS: PriceTier[] = ['student', 'employee', 'pupil', 'guest'];
const THEME_OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGE_OPTIONS: LanguagePreference[] = ['system', 'de', 'en'];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    canteens,
    clearOfflineCache,
    customApiUrl,
    detailSectionOrder,
    detailSections,
    effectiveScheme,
    languagePreference,
    palette,
    priceMode,
    selectedCanteenId,
    setCustomApiUrl,
    setLanguagePreference,
    setPriceMode,
    setSelectedCanteenId,
    setSkipWeekends,
    setThemeMode,
    skipWeekends,
    t,
    themeMode,
  } = useMensa();

  const enabledDetailCount = detailSectionOrder.filter((key) => detailSections[key]).length;

  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await clearOfflineCache();
      Alert.alert(t.settings.cacheClearedTitle, t.settings.cacheClearedBody);
    } finally {
      setClearing(false);
    }
  };

  const handleOpenGitHub = () => {
    void WebBrowser.openBrowserAsync(GITHUB_URL);
  };

  const handleResetEndpoint = () => {
    setCustomApiUrl(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t.settings.title,
          headerLargeTitle: !IS_IPAD,
        }}
      />

      <Host
        style={{ flex: 1, backgroundColor: palette.canvas }}
        colorScheme={effectiveScheme}
        seedColor={palette.brand}
      >
        <Form>
          <Section title={t.settings.sections.defaults}>
            <LabeledContent label={<Label title={t.settings.rows.canteen} systemImage="building.2" />}>
              {canteens.length > 0 ? (
                <Picker<string>
                  label={t.settings.rows.canteen}
                  selection={selectedCanteenId}
                  onSelectionChange={(value) => {
                    if (typeof value === 'string' && value.length > 0) {
                      setSelectedCanteenId(value);
                    }
                  }}
                  modifiers={[labelsHidden(), pickerStyle('menu'), lineLimit(1)]}
                >
                  {canteens.map((canteen) => (
                    <SwiftText
                      key={canteen.id}
                      modifiers={[tag(canteen.id), lineLimit(1), truncationMode('tail')]}
                    >
                      {canteen.name}
                    </SwiftText>
                  ))}
                </Picker>
              ) : (
                <SwiftText modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
                  {t.common.loading}
                </SwiftText>
              )}
            </LabeledContent>

            <LabeledContent
              label={<Label title={t.settings.rows.priceTier} systemImage="eurosign.circle" />}
            >
              <Picker<PriceTier>
                label={t.settings.rows.priceTier}
                selection={priceMode}
                onSelectionChange={(value) => {
                  if (value) {
                    setPriceMode(value);
                  }
                }}
                modifiers={[labelsHidden(), pickerStyle('menu')]}
              >
                {PRICE_TIERS.map((tier) => (
                  <SwiftText key={tier} modifiers={[tag(tier)]}>
                    {t.priceTiers[tier]}
                  </SwiftText>
                ))}
              </Picker>
            </LabeledContent>

            <Toggle
              isOn={skipWeekends}
              onIsOnChange={setSkipWeekends}
              label={t.settings.rows.skipWeekends}
              systemImage="calendar.badge.clock"
            />
          </Section>

          <Section title={t.settings.sections.detailPage}>
            <Button onPress={() => router.push('/(tabs)/settings/detail-sections')}>
              <LabeledContent
                label={
                  <Label
                    title={t.settings.rows.sectionsAndOrder}
                    systemImage="list.bullet.indent"
                    modifiers={[foregroundStyle(palette.text)]}
                  />
                }
              >
                <HStack spacing={6} alignment="center">
                  <SwiftText modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
                    {enabledDetailCount}/{detailSectionOrder.length}
                  </SwiftText>
                  <SwiftImage
                    systemName="chevron.right"
                    size={13}
                    modifiers={[foregroundStyle({ type: 'hierarchical', style: 'tertiary' })]}
                  />
                </HStack>
              </LabeledContent>
            </Button>
          </Section>

          <Section title={t.settings.sections.appearance}>
            <LabeledContent
              label={<Label title={t.settings.rows.theme} systemImage="circle.lefthalf.filled" />}
            >
              <Picker<ThemePreference>
                label={t.settings.rows.theme}
                selection={themeMode}
                onSelectionChange={(value) => {
                  if (value) {
                    setThemeMode(value);
                  }
                }}
                modifiers={[labelsHidden(), pickerStyle('menu')]}
              >
                {THEME_OPTIONS.map((opt) => (
                  <SwiftText key={opt} modifiers={[tag(opt)]}>
                    {t.settings.themes[opt]}
                  </SwiftText>
                ))}
              </Picker>
            </LabeledContent>

            <LabeledContent label={<Label title={t.settings.rows.language} systemImage="globe" />}>
              <Picker<LanguagePreference>
                label={t.settings.rows.language}
                selection={languagePreference}
                onSelectionChange={(value) => {
                  if (value) {
                    setLanguagePreference(value);
                  }
                }}
                modifiers={[labelsHidden(), pickerStyle('menu')]}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SwiftText key={opt} modifiers={[tag(opt)]}>
                    {t.settings.languages[opt]}
                  </SwiftText>
                ))}
              </Picker>
            </LabeledContent>
          </Section>

          <Section title={t.settings.sections.dataCache}>
            <LabeledContent label={<Label title={t.settings.rows.endpoint} systemImage="network" />}>
              <SwiftText
                modifiers={[
                  lineLimit(1),
                  truncationMode('middle'),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}
              >
                {resolveApiUrl(customApiUrl)}
              </SwiftText>
            </LabeledContent>

            {customApiUrl && customApiUrl !== DEFAULT_API_URL ? (
              <Button
                label={t.settings.rows.resetEndpoint}
                systemImage="arrow.uturn.backward"
                onPress={handleResetEndpoint}
              />
            ) : null}

            <Button
              role="destructive"
              modifiers={[tint(palette.danger), foregroundStyle(palette.danger)]}
              onPress={() => {
                void handleClearCache();
              }}
            >
              <Label
                title={clearing ? t.settings.rows.clearingCache : t.settings.rows.clearCache}
                systemImage="trash"
                modifiers={[foregroundStyle(palette.danger)]}
              />
            </Button>
          </Section>

          <Section title={t.settings.sections.about}>
            <LabeledContent label={<Label title={t.settings.rows.version} systemImage="info.circle" />}>
              <SwiftText modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
                1.0.0
              </SwiftText>
            </LabeledContent>

            <Button
              label={t.settings.rows.viewOnGithub}
              systemImage="safari"
              onPress={handleOpenGitHub}
            />
          </Section>
        </Form>
      </Host>
    </>
  );
}
