import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, hairline, radius, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** `surface` = white with hairline; `primarySoft` / `green` = quiet teal tint. */
  tone?: 'surface' | 'primarySoft' | 'green';
}

/** Flat card: hairline border, no elevation. */
export function Card({ children, style, padded = true, tone = 'surface' }: CardProps) {
  return (
    <View style={[styles.card, tone !== 'surface' && styles.tint, padded && styles.padded, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: hairline,
    borderColor: colors.borderStrong,
  },
  padded: { padding: spacing.xl },
  tint: { backgroundColor: colors.primarySofter, borderColor: colors.accentGreenBorder },
});
