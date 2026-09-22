import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, hairline, radius, spacing } from '../../theme';
import { Text } from './Text';

interface ChipProps {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Quiet pill: tinted background, hairline border, medium weight. */
const TONES = {
  neutral: { bg: colors.surface, fg: colors.textSecondary, border: colors.borderStrong },
  success: { bg: colors.primarySoft, fg: colors.primary, border: colors.accentGreenBorder },
  warning: { bg: colors.warningSoft, fg: colors.warning, border: '#F0E2C2' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: '#F2CFCC' },
  primary: { bg: colors.primary, fg: colors.surface, border: colors.primary },
} as const;

export function Chip({ label, tone = 'neutral', icon }: ChipProps) {
  const palette = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      {icon ? <Ionicons name={icon} size={13} color={palette.fg} style={styles.icon} /> : null}
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: hairline,
  },
  icon: { marginRight: spacing.xs },
  label: { fontSize: 12, fontWeight: '500' },
});
