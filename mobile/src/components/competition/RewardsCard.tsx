import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { Reward } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing } from '../../theme';
import { formatMoney } from '../../utils/format';
import { Card } from '../ui/Card';
import { SectionTitle } from '../ui/SectionTitle';

function PositionIcon({ position }: { position: number }) {
  if (position === 1) return <Ionicons name="trophy" size={20} color={colors.gold} />;
  if (position === 2) return <Ionicons name="medal" size={20} color={colors.silver} />;
  if (position === 3) return <Ionicons name="medal" size={20} color={colors.bronze} />;
  return <Ionicons name="star-outline" size={20} color={colors.primary} />;
}

export function RewardsCard({ rewards, currency }: { rewards: Reward[]; currency: string }) {
  const { t, lang } = useLanguage();
  if (!rewards.length) return null;
  return (
    <Card>
      <SectionTitle title={t('rewards')} hint={t('all_positions')} />
      <View style={styles.list}>
        {rewards.map((reward, i) => (
          <View key={reward.position} style={[styles.row, i % 2 === 0 && styles.rowShaded]}>
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
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: spacing.sm, borderRadius: radius.sm, gap: spacing.lg },
  rowShaded: { backgroundColor: colors.primarySofter },
  label: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  amount: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
