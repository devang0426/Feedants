import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

interface ChipProps {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
  icon?: keyof typeof Ionicons.glyphMap;
}

const TONES = {
  neutral: { bg: colors.chip, fg: colors.text },
  success: { bg: colors.primarySoft, fg: colors.primary },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  primary: { bg: colors.primary, fg: colors.surface },
} as const;

export function Chip({ label, tone = 'neutral', icon }: ChipProps) {
  const palette = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      {icon ? <Ionicons name={icon} size={14} color={palette.fg} style={styles.icon} /> : null}
      <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  icon: { marginRight: spacing.xs },
  label: { fontSize: 13, fontWeight: '600' },
});
