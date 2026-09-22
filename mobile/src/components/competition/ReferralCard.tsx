import React, { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing } from '../../theme';
import { formatMoney } from '../../utils/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ReferralCardProps {
  link: string | null;
  rewardPaise: number;
  currency: string;
  competitionTitle: string;
}

export function ReferralCard({ link, rewardPaise, currency, competitionTitle }: ReferralCardProps) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  if (!link) return null;

  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
  };
  const share = () => {
    Share.share({ message: `Join me in "${competitionTitle}" on Feedants: ${link}` }).catch(() => undefined);
  };

  return (
    <Card tone="green">
      <View style={styles.row}>
        <Ionicons name="megaphone-outline" size={40} color={colors.primary} style={styles.icon} />
        <View style={styles.body}>
          <Text style={styles.title}>{t('refer_earn')}</Text>
          <View style={styles.linkRow}>
            <Text style={styles.link} numberOfLines={1} ellipsizeMode="middle">
              {link}
            </Text>
            <Pressable onPress={copy} style={styles.copy} accessibilityRole="button" accessibilityLabel={t('copy_link')}>
              <Text style={styles.copyText}>{copied ? t('copied') : t('copy_link')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label={t('refer_now')} onPress={share} style={styles.referButton} />
        <Text style={styles.earn}>
          {t('you_earn', { amount: formatMoney(rewardPaise, currency, lang) })}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.md },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentGreenBorder,
    overflow: 'hidden',
  },
  link: { flex: 1, fontSize: 12, color: colors.textSecondary, paddingHorizontal: spacing.md, paddingVertical: 9 },
  copy: { borderLeftWidth: 1, borderLeftColor: colors.accentGreenBorder, paddingHorizontal: spacing.md, paddingVertical: 9 },
  copyText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.md, gap: spacing.md },
  referButton: { minWidth: 150 },
  earn: { fontSize: 12, color: colors.primary, fontWeight: '600' },
});
