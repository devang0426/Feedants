import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, hairline, radius, spacing } from '../../theme';
import { Text } from './Text';

interface ButtonProps {
  label: string;
  subLabel?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Calm button: solid teal for the one primary action, hairline outline otherwise. */
export function Button({
  label,
  subLabel,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'md',
  style,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' ? colors.surface : variant === 'danger' ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'danger' && styles.dangerOutline,
        variant === 'ghost' && styles.ghost,
        isDisabled && variant === 'primary' && styles.primaryDisabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <Text style={[styles.label, size === 'lg' && styles.labelLg, { color: textColor }]}>{label}</Text>
          {subLabel ? <Text style={[styles.subLabel, { color: textColor }]}>{subLabel}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: 44,
  },
  lg: { minHeight: 52, paddingVertical: spacing.sm },
  primary: { backgroundColor: colors.primary },
  primaryDisabled: { backgroundColor: colors.disabled },
  outline: { borderWidth: hairline, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  dangerOutline: { borderWidth: hairline, borderColor: '#F2CFCC', backgroundColor: colors.surface },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.8 },
  label: { fontSize: 14, fontWeight: '600' },
  labelLg: { fontSize: 15 },
  subLabel: { fontSize: 12, opacity: 0.85, marginTop: 1, fontWeight: '400' },
});
