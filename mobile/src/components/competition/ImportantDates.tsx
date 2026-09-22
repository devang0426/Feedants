import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionDetails } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { formatShortDate, formatTime } from '../../utils/format';
import { Card } from '../ui/Card';

interface DateCellProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iso: string;
  isPast: boolean;
}

function DateCell({ icon, label, iso, isPast }: DateCellProps) {
  const { lang } = useLanguage();
  return (
    <View style={styles.cell}>
      <Ionicons name={icon} size={20} color={isPast ? colors.textMuted : colors.primary} />
      <View style={styles.cellText}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={[styles.date, isPast && styles.past]}>{formatShortDate(iso, lang)}</Text>
        <Text style={[styles.time, isPast && styles.past]}>{formatTime(iso, lang)}</Text>
      </View>
    </View>
  );
}

export function ImportantDates({ competition, now }: { competition: CompetitionDetails; now: Date }) {
  const { t } = useLanguage();
  const w = competition.windows;
  const isPast = (iso: string) => new Date(iso).getTime() <= now.getTime();

  return (
    <Card>
      <Text style={[typography.h2, styles.title]}>{t('important_dates')}</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <DateCell icon="calendar-outline" label={t('register_before')} iso={w.registration.closesAt} isPast={isPast(w.registration.closesAt)} />
          <View style={styles.vDivider} />
          <DateCell icon="paper-plane-outline" label={t('submission_starts')} iso={w.submission.startsAt} isPast={isPast(w.submission.startsAt)} />
        </View>
        <View style={styles.hDivider} />
        <View style={styles.row}>
          <DateCell icon="cloud-upload-outline" label={t('submission_ends')} iso={w.submission.endsAt} isPast={isPast(w.submission.endsAt)} />
          <View style={styles.vDivider} />
          <DateCell icon="trophy-outline" label={t('result_date')} iso={w.results.at} isPast={isPast(w.results.at)} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.md },
  grid: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cell: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, gap: spacing.md },
  cellText: { flex: 1 },
  date: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: 2 },
  time: { fontSize: 13, fontWeight: '500', color: colors.text, marginTop: 1 },
  past: { color: colors.textMuted },
  vDivider: { width: 1, backgroundColor: colors.border },
  hDivider: { height: 1, backgroundColor: colors.border },
});
