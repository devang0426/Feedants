import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionDetails } from '../../api/types';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from '../ui/Card';

const open = (url: string | null) => {
  if (url) Linking.openURL(url).catch(() => undefined);
};

export function PaymentInfoCard({ media }: { media: CompetitionDetails['media'] }) {
  const { t } = useLanguage();
  return (
    <Card>
      <View style={styles.row}>
        <Pressable style={styles.left} onPress={() => open(media.prizeMoneyVideoUrl)} accessibilityRole="button">
          <View style={styles.playBox}>
            <Ionicons name="play" size={22} color={colors.surface} />
          </View>
          <View style={styles.leftText}>
            <Text style={styles.question}>{t('how_receive_prize')}</Text>
            <Text style={typography.caption}>{t('watch_video')}</Text>
          </View>
        </Pressable>
        <View style={styles.divider} />
        <View style={styles.right}>
          <Pressable style={styles.line} onPress={() => open(media.refundPolicyUrl)} accessibilityRole="link">
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
            <Text style={styles.lineText}>{t('refund_policy')}</Text>
          </Pressable>
          <View style={styles.line}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.lineText} numberOfLines={2}>
              {t('secure_payments')} <Text style={styles.provider}>{media.paymentProvider}</Text>
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  leftText: { flex: 1 },
  question: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: spacing.md },
  right: { flex: 1, gap: spacing.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lineText: { fontSize: 13, color: colors.text, flex: 1 },
  provider: { fontWeight: '700', color: colors.primaryDark, fontStyle: 'italic' },
});
