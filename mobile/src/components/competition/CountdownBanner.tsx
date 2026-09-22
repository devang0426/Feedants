import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { Countdown } from '../../api/types';
import { useLanguage } from '../../i18n';
import { useCountdown } from '../../hooks/useCountdown';
import { colors, radius, spacing } from '../../theme';
import { formatCountdown } from '../../utils/format';

const LABEL_KEYS: Record<Countdown['key'], string> = {
  registration_opens: 'registration_opens_in',
  registration_closes: 'registration_closes_in',
  submission_starts: 'submission_starts_in',
  submission_ends: 'submission_ends_in',
  results_in: 'results_in',
};

export function CountdownBanner({ countdown }: { countdown: Countdown | null }) {
  const { t } = useLanguage();
  const parts = useCountdown(countdown?.targetAt);
  if (!countdown || !parts) return null;

  const showHurry = countdown.urgent && !parts.isOver;

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Ionicons name="hourglass-outline" size={20} color={colors.primary} />
      <Text style={styles.label} numberOfLines={1}>
        {t(LABEL_KEYS[countdown.key])}
      </Text>
      <Text style={styles.time} accessibilityLabel={formatCountdown(parts)}>
        {formatCountdown(parts)}
      </Text>
      {showHurry ? (
        <View style={styles.hurry}>
          <Ionicons name="stopwatch-outline" size={18} color={colors.primary} />
          <Text style={styles.hurryText}>{t('hurry_up')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: spacing.md,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1 },
  time: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  hurry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hurryText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
