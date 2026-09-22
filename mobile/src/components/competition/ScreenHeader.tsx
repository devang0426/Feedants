import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, hairline, radius, spacing } from '../../theme';
import { useLanguage, type Lang } from '../../i18n';
import { Text } from '../ui/Text';

interface ScreenHeaderProps {
  onBack?: () => void;
}

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'ENG' },
  { value: 'hi', label: 'हिंदी' },
];

/** Minimal header: text back link on the left, quiet segmented language toggle on the right. */
export function ScreenHeader({ onBack }: ScreenHeaderProps) {
  const { lang, setLang, t } = useLanguage();
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('go_back')} style={styles.back} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backLabel}>{t('go_back')}</Text>
        </Pressable>
      ) : (
        <Text style={styles.brand}>feedants</Text>
      )}

      <View style={styles.toggle} accessibilityRole="radiogroup">
        {LANG_OPTIONS.map((opt) => {
          const active = opt.value === lang;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setLang(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.toggleItem, active && styles.toggleItemActive]}
            >
              <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backLabel: { fontSize: 15, fontWeight: '500', color: colors.text, marginLeft: spacing.xs },
  brand: { fontSize: 16, fontWeight: '600', color: colors.primary, letterSpacing: 0.4 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.chip,
    borderRadius: radius.pill,
    padding: 2,
    borderWidth: hairline,
    borderColor: colors.border,
  },
  toggleItem: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  toggleItemActive: { backgroundColor: colors.surface, borderWidth: hairline, borderColor: colors.borderStrong },
  toggleLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  toggleLabelActive: { color: colors.primary, fontWeight: '600' },
});
