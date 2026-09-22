import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Reward } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, hairline, spacing } from '../../theme';
import { formatMoney } from '../../utils/format';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';
import { Text } from '../ui/Text';

function PositionIcon({ position }: { position: number }) {
  if (position === 1) return <Ionicons name="trophy-outline" size={18} color={colors.gold} />;
  if (position === 2) return <Ionicons name="medal-outline" size={18} color={colors.silver} />;
  if (position === 3) return <Ionicons name="medal-outline" size={18} color={colors.bronze} />;
  return <Ionicons name="star-outline" size={18} color={colors.textMuted} />;
}

/** Hairline-separated rows; no zebra fill. */
export function RewardsCard({ rewards, currency }: { rewards: Reward[]; currency: string }) {
  const { t, lang } = useLanguage();
  if (!rewards.length) return null;
  return (
    <Card>
      <SectionTitle title={t('rewards')} hint={t('all_positions')} />
      <View>
        {rewards.map((reward, i) => (
          <View key={reward.position} style={[styles.row, i > 0 && styles.divider]}>
            <PositionIcon position={reward.position} />
            <Text style={styles.label}>{reward.label}</Text>
            <Text style={styles.amount}>{formatMoney(reward.amountPaise, currency, lang)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: spacing.md },
  divider: { borderTopWidth: hairline, borderTopColor: colors.border },
  label: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.text },
  amount: { fontSize: 15, fontWeight: '600', color: colors.primary, fontVariant: ['tabular-nums'] },
});
