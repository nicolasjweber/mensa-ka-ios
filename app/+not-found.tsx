import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useMensa } from '@/store/MensaContext';

export default function NotFoundScreen() {
  const { palette, t } = useMensa();

  return (
    <>
      <Stack.Screen options={{ title: t.notFound.title }} />
      <View style={[styles.container, { backgroundColor: palette.canvas }]}>
        <Text style={[styles.title, { color: palette.text }]}>{t.notFound.message}</Text>
        <Link href="/(tabs)/(menu)/index" style={styles.link}>
          <Text style={[styles.linkText, { color: palette.brand }]}>{t.notFound.cta}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    marginTop: 16,
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
