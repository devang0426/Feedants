import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from '../ui/Card';

export function TestimonialsRow({ url }: { url: string | null }) {
  const { t } = useLanguage();
  const open = () => {
    if (url) Linking.openURL(url).catch(() => undefined);
  };
  return (
    <Card padded={false}>
      <Pressable onPress={open} style={styles.row} accessibilityRole="button" disabled={!url}>
        <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
        <View style={styles.text}>
          <Text style={styles.title}>{t('hear_from_users')}</Text>
          <Text style={typography.caption}>{t('hear_from_users_sub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </Pressable>
    </Card>
  );
}

export function AdPlaceholder() {
  const { t } = useLanguage();
  return (
    <View style={styles.ad}>
      <Ionicons name="megaphone-outline" size={18} color={colors.textMuted} />
      <Text style={styles.adText}>{t('ad_here')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  ad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  adText: { ...typography.captionMuted, fontWeight: '600' },
});
