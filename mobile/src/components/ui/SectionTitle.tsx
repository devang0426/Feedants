import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { spacing, typography } from '../../theme';

interface SectionTitleProps {
  title: string;
  hint?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ title, hint, right }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={typography.h2}>{title}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  left: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 1 },
  hint: { ...typography.caption, marginLeft: spacing.sm },
});
