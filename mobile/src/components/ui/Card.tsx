import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  tone?: 'surface' | 'primarySoft' | 'green';
}

export function Card({ children, style, padded = true, tone = 'surface' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        tone === 'primarySoft' && styles.primarySoft,
        tone === 'green' && styles.green,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
  primarySoft: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  green: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreenBorder },
});
