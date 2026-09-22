import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface AvatarProps {
  /** Stable identity for the generated art (e-mail, id or name). */
  seed: string;
  /** Real uploaded photo. When present it wins; otherwise art is generated. */
  uri?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Muted duo-tones that sit beside the teal design system without competing
 * with it. Index is chosen from the seed hash, so a person always gets the
 * same colours on every screen and every device.
 */
const PALETTES: readonly (readonly [string, string])[] = [
  ['#0F7B84', '#CCE5E7'], // brand teal
  ['#356C9B', '#D2E2EF'], // slate blue
  ['#6F5A9E', '#DED6EE'], // violet
  ['#A2603A', '#EFDACB'], // terracotta
  ['#4F7A45', '#DAE8D4'], // moss
  ['#9C8036', '#EDE3C7'], // ochre
  ['#9E4459', '#EFD5DA'], // rose
  ['#3E6E70', '#D3E2E3'], // deep aqua
];

/** FNV-1a: small, fast, and stable across platforms. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic abstract avatar. Draws layered geometric shapes from a hash
 * of the seed using plain Views, so it needs no SVG dependency, no network
 * request, and renders identically offline.
 */
export function Avatar({ seed, uri, size = 44, style, accessibilityLabel }: AvatarProps) {
  const art = useMemo(() => {
    const hash = hashSeed(seed || 'anonymous');
    const [ink, wash] = PALETTES[hash % PALETTES.length];
    return {
      ink,
      wash,
      variant: (hash >> 3) % 4,
      // Spread offsets across the tile so shapes are not all centred.
      dx: ((hash >> 5) % 5) / 10 - 0.2,
      dy: ((hash >> 8) % 5) / 10 - 0.2,
      angle: (hash >> 11) % 90,
    };
  }, [seed]);

  const frame: ViewStyle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    // Border/size styles are valid on both View and Image, but the two style
    // types are not assignable to each other, so narrow it here.
    return (
      <Image
        source={{ uri }}
        style={[frame, styles.photo, style] as StyleProp<ImageStyle>}
        accessibilityLabel={accessibilityLabel}
        accessible={Boolean(accessibilityLabel)}
      />
    );
  }

  const { ink, wash, variant, dx, dy, angle } = art;

  return (
    <View
      style={[frame, styles.frame, { backgroundColor: wash }, style]}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
    >
      {variant === 0 ? (
        <>
          <Layer size={size * 0.78} radius="round" color={ink} x={size * (0.1 + dx)} y={size * (0.26 + dy)} />
          <Layer size={size * 0.5} radius="round" color={wash} x={size * (0.42 + dx)} y={size * (0.1 + dy)} opacity={0.85} />
        </>
      ) : variant === 1 ? (
        <>
          <Layer size={size * 0.68} radius={size * 0.18} color={ink} x={size * (0.16 + dx)} y={size * (0.16 + dy)} angle={angle} />
          <Layer size={size * 0.26} radius="round" color={wash} x={size * (0.52 + dx)} y={size * (0.52 + dy)} />
        </>
      ) : variant === 2 ? (
        <>
          {/* Oversized circle reads as a sweeping curve once clipped. */}
          <Layer size={size * 1.25} radius="round" color={ink} x={size * (0.45 + dx)} y={size * (0.3 + dy)} />
          <Layer size={size * 0.3} radius="round" color={ink} x={size * (0.12 + dx)} y={size * (0.14 + dy)} opacity={0.55} />
        </>
      ) : (
        <>
          <Layer size={size * 0.86} radius="round" color={ink} x={size * (0.07 + dx)} y={size * (0.07 + dy)} opacity={0.9} />
          <Layer size={size * 0.52} radius="round" color={wash} x={size * (0.24 + dx)} y={size * (0.24 + dy)} />
          <Layer size={size * 0.22} radius="round" color={ink} x={size * (0.39 + dx)} y={size * (0.39 + dy)} />
        </>
      )}
    </View>
  );
}

interface LayerProps {
  size: number;
  color: string;
  x: number;
  y: number;
  radius: number | 'round';
  opacity?: number;
  angle?: number;
}

function Layer({ size, color, x, y, radius, opacity = 1, angle }: LayerProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: radius === 'round' ? size / 2 : radius,
        backgroundColor: color,
        opacity,
        ...(angle ? { transform: [{ rotate: `${angle}deg` }] } : null),
      }}
    />
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
  photo: { backgroundColor: colors.chip },
});
