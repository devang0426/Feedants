import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, typography } from '../../theme';
import { Text } from './Text';

interface SectionTitleProps {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  /** Render as a small uppercase eyebrow instead of a heading. */
  eyebrow?: boolean;
}

export function SectionTitle({ title, hint, right, eyebrow }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={eyebrow ? typography.eyebrow : typography.h2}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  left: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 },
  hint: { ...typography.captionMuted, marginLeft: spacing.sm },
});
