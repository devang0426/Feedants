import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Countdown } from '../../api/types';
import { useLanguage } from '../../i18n';
import { useCountdown } from '../../hooks/useCountdown';
import { colors, hairline, radius, spacing, typography } from '../../theme';
import { formatCountdown } from '../../utils/format';
import { Text } from '../ui/Text';

const LABEL_KEYS: Record<Countdown['key'], string> = {
  registration_opens: 'registration_opens_in',
  registration_closes: 'registration_closes_in',
  submission_starts: 'submission_starts_in',
  submission_ends: 'submission_ends_in',
  results_in: 'results_in',
};

/** Quiet strip: eyebrow label, tabular teal digits, subtle urgency tag. */
export function CountdownBanner({ countdown }: { countdown: Countdown | null }) {
  const { t } = useLanguage();
  const parts = useCountdown(countdown?.targetAt);
  if (!countdown || !parts) return null;

  const showHurry = countdown.urgent && !parts.isOver;

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <View style={styles.left}>
        <Ionicons name="hourglass-outline" size={16} color={colors.textMuted} />
        <Text style={typography.eyebrow} numberOfLines={1}>
          {t(LABEL_KEYS[countdown.key])}
        </Text>
      </View>
      <Text style={styles.time} accessibilityLabel={formatCountdown(parts)}>
        {formatCountdown(parts)}
      </Text>
      {showHurry ? (
        <View style={styles.hurry}>
          <Ionicons name="flash-outline" size={13} color={colors.warning} />
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
    justifyContent: 'space-between',
    backgroundColor: colors.primarySofter,
    borderRadius: radius.md,
    borderWidth: hairline,
    borderColor: colors.accentGreenBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  time: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  hurry: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hurryText: { fontSize: 12, fontWeight: '500', color: colors.warning },
});
