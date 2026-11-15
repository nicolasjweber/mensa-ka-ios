import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

export const IS_IPAD = Platform.OS === 'ios' && Platform.isPad;

export interface ResponsiveLayout {
  width: number;
  availableWidth: number;
  safeLeft: number;
  safeRight: number;
  isWide: boolean;
  columns: 1 | 2;
  contentMaxWidth: number;
  detailMaxWidth: number;
  listPaddingLeft: number;
  listPaddingRight: number;
  detailPaddingLeft: number;
  detailPaddingRight: number;
}

const CONTENT_MAX_WIDTH = 1040;
const DETAIL_MAX_WIDTH = 820;

/**
 * Computes responsive layout breakpoints and horizontal centering insets for
 * iPhone, iPad Split View / Slide Over, and iPadOS sidebar-open / full-width windows.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const safeLeft = insets.left;
  const safeRight = insets.right;
  const availableWidth = Math.max(0, width - safeLeft - safeRight);
  const isWide = availableWidth >= 720;

  const listInnerPadding = Math.max(
    Spacing.lg,
    Math.round((availableWidth - CONTENT_MAX_WIDTH) / 2),
  );
  const detailInnerPadding = Math.max(
    Spacing.lg,
    Math.round((availableWidth - DETAIL_MAX_WIDTH) / 2),
  );

  return {
    width,
    availableWidth,
    safeLeft,
    safeRight,
    isWide,
    columns: isWide ? 2 : 1,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    detailMaxWidth: DETAIL_MAX_WIDTH,
    listPaddingLeft: safeLeft + listInnerPadding,
    listPaddingRight: safeRight + listInnerPadding,
    detailPaddingLeft: safeLeft + detailInnerPadding,
    detailPaddingRight: safeRight + detailInnerPadding,
  };
}

/**
 * Groups items into fixed-size rows so SectionList can render multi-column grids
 * on regular-width iPad screens while keeping section headers intact.
 */
export function chunkRows<T>(items: T[], columns: number): T[][] {
  if (columns <= 1) {
    return items.map((item) => [item]);
  }
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}
