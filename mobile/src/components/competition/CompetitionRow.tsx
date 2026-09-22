import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionSummary, Phase } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMoney, formatShortDate } from '../../utils/format';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { Text } from '../ui/Text';

export const PHASE_TONE: Record<Phase, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  cancelled: 'danger',
  upcoming: 'neutral',
  registration_open: 'success',
  registration_closed: 'warning',
  submission_open: 'warning',
  judging: 'warning',
  results_announced: 'neutral',
};

interface CompetitionRowProps {
  item: CompetitionSummary;
  onPress: () => void;
  /** Optional trailing element, e.g. a registration status chip. */
  trailing?: React.ReactNode;
}

/** Compact list card used by Home, Explore, Competitions and Profile. */
export function CompetitionRow({ item, onPress, trailing }: CompetitionRowProps) {
  const { t, lang } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Card style={styles.row}>
        {item.judgeAvatarUrl ? (
          <Image source={{ uri: item.judgeAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="trophy-outline" size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={typography.caption} numberOfLines={1}>
            {item.category}
            {item.judgeName ? ` · ${item.judgeName}` : ''}
          </Text>
          <View style={styles.meta}>
            <Chip label={t(`phase_${item.phase}`)} tone={PHASE_TONE[item.phase]} />
            <Text style={[typography.caption, item.capacity.isFull && styles.full]} numberOfLines={1}>
              {item.capacity.isFull
                ? t('spots_full')
                : t('booked', { booked: item.capacity.booked, total: item.capacity.total })}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          {trailing ?? (
            <>
              <Text style={styles.fee}>
                {item.entryFeePaise === 0 ? t('free') : formatMoney(item.entryFeePaise, item.currency, lang)}
              </Text>
              <Text style={typography.captionMuted}>{formatShortDate(item.registrationClosesAt, lang)}</Text>
            </>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  pressed: { opacity: 0.85 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.chip },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySofter },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  full: { color: colors.danger, fontWeight: '500' },
  right: { alignItems: 'flex-end', gap: 2 },
  fee: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
