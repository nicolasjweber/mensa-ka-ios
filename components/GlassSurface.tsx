import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  contentShape,
  glassEffect,
  shapes,
  tint,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';
import { GlassView, isLiquidGlassAvailable, type GlassStyle } from 'expo-glass-effect';
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useMensa } from '@/store/MensaContext';

export type GlassPillShape = 'capsule' | 'circle' | 'roundedRectangle';
export type GlassPillTone = 'neutral' | 'accent' | 'active';

export interface GlassButtonModifiersOptions {
  liquidGlass: boolean;
  scheme: 'light' | 'dark';
  brandColor: string;
  shape: GlassPillShape;
  cornerRadius?: number;
  tone?: GlassPillTone;
  accessibilityLabel?: string;
}

function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) {
    return color;
  }
  const hex = match[1];
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Returns SwiftUI Button modifiers for crisp Liquid Glass pills and tiles without clipped
 * `.buttonStyle(.glass)` box shadows or flat `.glassProminent` opaque fills, falling back to
 * native `.bordered` / `.borderedProminent` styles when Reduce Transparency is enabled.
 */
export function glassButtonModifiers({
  liquidGlass,
  scheme,
  brandColor,
  shape,
  cornerRadius,
  tone = 'neutral',
  accessibilityLabel: label,
}: GlassButtonModifiersOptions): ViewModifier[] {
  if (!liquidGlass) {
    return [
      buttonStyle(tone === 'active' ? 'borderedProminent' : 'bordered'),
      buttonBorderShape(shape, cornerRadius),
      ...(tone === 'active' || tone === 'accent' ? [tint(brandColor)] : []),
      ...(label ? [accessibilityLabel(label)] : []),
    ];
  }

  let glassTint: string;
  if (tone === 'active') {
    glassTint = withAlpha(brandColor, scheme === 'dark' ? 0.88 : 0.86);
  } else if (tone === 'accent') {
    glassTint = withAlpha(brandColor, scheme === 'dark' ? 0.22 : 0.14);
  } else {
    glassTint = scheme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.75)';
  }

  let hitShape;
  if (shape === 'circle') {
    hitShape = shapes.circle();
  } else if (shape === 'roundedRectangle') {
    hitShape = shapes.roundedRectangle({ cornerRadius });
  } else {
    hitShape = shapes.capsule();
  }

  return [
    buttonStyle('plain'),
    contentShape(hitShape),
    glassEffect({
      glass: {
        variant: 'regular',
        interactive: true,
        tint: glassTint,
      },
      shape,
      ...(shape === 'roundedRectangle' && cornerRadius !== undefined ? { cornerRadius } : {}),
    }),
    ...(label ? [accessibilityLabel(label)] : []),
  ];
}

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glassStyle?: GlassStyle;
  isInteractive?: boolean;
  tintColor?: ColorValue;
  fallbackColor?: string;
  colorScheme?: 'light' | 'dark';
}

const LIQUID_GLASS_SUPPORTED = (() => {
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
})();

/**
 * Returns true when native iOS 26+ Liquid Glass is available and Reduce Transparency is off.
 */
export function useLiquidGlassEnabled(): boolean {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !LIQUID_GLASS_SUPPORTED) {
      return;
    }
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceTransparency(enabled);
        }
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (enabled) => {
      setReduceTransparency(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return LIQUID_GLASS_SUPPORTED && !reduceTransparency;
}

export function GlassSurface({
  children,
  style,
  glassStyle = 'regular',
  isInteractive = false,
  tintColor,
  fallbackColor,
  colorScheme,
}: GlassSurfaceProps) {
  const { effectiveScheme, palette } = useMensa();
  const resolvedScheme = colorScheme ?? effectiveScheme;
  const liquidGlassEnabled = useLiquidGlassEnabled();

  if (liquidGlassEnabled) {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        isInteractive={isInteractive}
        tintColor={tintColor}
        colorScheme={resolvedScheme}
        style={style}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        resolvedScheme === 'dark' ? styles.fallbackShadowDark : styles.fallbackShadowLight,
        {
          backgroundColor: fallbackColor ?? palette.surfaceElevated,
          borderColor: tintColor ? 'transparent' : palette.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: 1,
  },
  fallbackShadowLight: {
    shadowColor: '#071c18',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  fallbackShadowDark: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
