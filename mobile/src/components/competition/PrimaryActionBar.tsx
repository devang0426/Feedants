import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import type { CompetitionDetails } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, spacing } from '../../theme';
import { formatDateTime, formatMoney } from '../../utils/format';
import { Button } from '../ui/Button';

interface PrimaryActionBarProps {
  competition: CompetitionDetails;
  busy: boolean;
  onPrimary: () => void;
  onCancel: () => void;
}

/**
 * Renders the server-decided primary action. The client only maps label
 * keys to copy; it never re-derives *which* action is allowed.
 */
export function PrimaryActionBar({ competition, busy, onPrimary, onCancel }: PrimaryActionBarProps) {
  const { t, lang } = useLanguage();
  const { primaryAction, canCancel } = competition.viewer;

  const dateParam = primaryAction.subLabelAt ? { date: formatDateTime(primaryAction.subLabelAt, lang) } : undefined;
  const label = t(primaryAction.labelKey, dateParam);

  let subLabel: string | undefined;
  if (primaryAction.subLabelKey === 'entry_fee') {
    subLabel =
      competition.entryFeePaise === 0
        ? t('free')
        : `${t('entry_fee')} ${formatMoney(competition.entryFeePaise, competition.currency, lang)}`;
  } else if (primaryAction.subLabelKey) {
    subLabel = t(primaryAction.subLabelKey, dateParam);
  }

  return (
    <View style={styles.wrap}>
      {canCancel ? (
        <Pressable onPress={onCancel} disabled={busy} style={styles.cancel} accessibilityRole="button">
          <Text style={styles.cancelText}>{t('cancel_registration')}</Text>
        </Pressable>
      ) : null}
      <Button
        label={label}
        subLabel={subLabel}
        size="lg"
        loading={busy}
        disabled={!primaryAction.enabled}
        onPress={onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancel: { alignSelf: 'center', paddingVertical: 6, marginBottom: 2 },
  cancelText: { color: colors.danger, fontSize: 12.5, fontWeight: '500' },
});
