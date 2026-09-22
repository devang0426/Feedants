import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n';
import { colors, radius, spacing } from '../../theme';

export function DisclaimerBanner({ text }: { text: string }) {
  const { t } = useLanguage();
  if (!text) return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
      <Text style={styles.text}>
        <Text style={styles.bold}>{t('disclaimer')} </Text>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  bold: { fontWeight: '700', color: colors.primary },
});
