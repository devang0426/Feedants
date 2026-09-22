import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Button } from './Button';

export function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface ErrorStateProps {
  title: string;
  message?: string;
  hint?: string;
  retryLabel: string;
  onRetry: () => void;
}

export function ErrorState({ title, message, hint, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Button label={retryLabel} onPress={onRetry} variant="outline" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  title: { ...typography.h2, marginTop: spacing.md },
  message: { ...typography.bodySecondary, marginTop: spacing.sm, textAlign: 'center' },
  hint: { ...typography.captionMuted, marginTop: spacing.xs, textAlign: 'center' },
  button: { marginTop: spacing.lg, minWidth: 140 },
});
