import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionDetails } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, spacing, typography } from '../../theme';
import { formatMoney } from '../../utils/format';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { useCountdown } from '../../hooks/useCountdown';

const pad = (n: number) => String(n).padStart(2, '0');

interface SummaryCardProps {
  competition: CompetitionDetails;
}

export function SummaryCard({ competition }: SummaryCardProps) {
  const { t, lang } = useLanguage();
  const { capacity, viewer } = competition;
  const isReserved = viewer.registration?.status === 'reserved' && viewer.registration.isActive;
  const hold = useCountdown(isReserved ? viewer.registration?.expiresAt : null);
  const fillRatio = capacity.total > 0 ? Math.min(capacity.booked / capacity.total, 1) : 0;
  const isLow = capacity.spotsLeft > 0 && capacity.spotsLeft <= Math.ceil(capacity.total * 0.25);

  const spotsLabel = capacity.isFull
    ? t('spots_full')
    : capacity.spotsLeft === 1
      ? t('spots_left_one')
      : t('spots_left', { n: capacity.spotsLeft });

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text style={[typography.h1, styles.title]} numberOfLines={2}>
          {competition.title}
        </Text>
        {viewer.isRegistered ? (
          <Chip label={t('registered')} tone="success" icon="checkmark-circle" />
        ) : isReserved ? (
          <Chip
            label={hold ? t('spot_held_timer', { time: `${pad(hold.minutes + hold.hours * 60)}:${pad(hold.seconds)}` }) : t('complete_payment')}
            tone="warning"
            icon="time-outline"
          />
        ) : capacity.isFull ? (
          <Chip label={t('spots_full')} tone="danger" icon="close-circle" />
        ) : null}
      </View>

      <View style={styles.chipRow}>
        <Chip label={competition.category} />
        {competition.tags.map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
        {competition.perks[0] ? (
          <View style={styles.perk}>
            <Ionicons name="trophy-outline" size={16} color={colors.primary} />
            <Text style={styles.perkText}>{competition.perks[0]}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={typography.caption}>{t('prize_pool')}</Text>
          <Text style={typography.money}>{formatMoney(competition.prizePoolPaise, competition.currency, lang)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={typography.caption}>{t('entry_fee')}</Text>
          <Text style={typography.money}>
            {competition.entryFeePaise === 0 ? t('free') : formatMoney(competition.entryFeePaise, competition.currency, lang)}
          </Text>
        </View>
        <View style={[styles.stat, styles.spots]}>
          <View style={styles.spotsHeader}>
            <Ionicons name="people-outline" size={16} color={capacity.isFull ? colors.danger : colors.primary} />
            <Text
              style={[
                styles.spotsLabel,
                capacity.isFull && styles.spotsFull,
                isLow && !capacity.isFull && styles.spotsLow,
              ]}
              numberOfLines={1}
            >
              {spotsLabel}
            </Text>
          </View>
          <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: capacity.total, now: capacity.booked }}>
            <View style={[styles.fill, { width: `${fillRatio * 100}%` }, capacity.isFull && styles.fillFull]} />
          </View>
          <Text style={styles.booked}>{t('booked', { booked: capacity.booked, total: capacity.total })}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { flex: 1, marginRight: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: spacing.xs },
  perkText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.xl, gap: spacing.md },
  stat: { flex: 1 },
  spots: { flex: 1.4 },
  spotsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spotsLabel: { color: colors.primary, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  spotsLow: { color: colors.warning },
  spotsFull: { color: colors.danger },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.primarySoft, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  fillFull: { backgroundColor: colors.danger },
  booked: { ...typography.caption, color: colors.primary, marginTop: spacing.sm },
});
