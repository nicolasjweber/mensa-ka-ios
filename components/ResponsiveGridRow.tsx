import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

interface ResponsiveGridRowProps<T> {
  items: T[];
  columns: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * Renders a SectionList row either directly (single-column) or as an even
 * multi-column row with placeholder cells for partial trailing rows.
 */
export function ResponsiveGridRow<T>({
  items,
  columns,
  renderItem,
}: ResponsiveGridRowProps<T>) {
  if (columns <= 1) {
    return (
      <>
        {items.map((item, idx) => (
          <React.Fragment key={idx}>{renderItem(item, idx)}</React.Fragment>
        ))}
      </>
    );
  }

  const placeholders = Math.max(0, columns - items.length);

  return (
    <View style={styles.row}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.cell}>
          {renderItem(item, idx)}
        </View>
      ))}
      {Array.from({ length: placeholders }).map((_, idx) => (
        <View key={`empty-${idx}`} style={styles.cell} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  cell: {
    flex: 1,
  },
});
