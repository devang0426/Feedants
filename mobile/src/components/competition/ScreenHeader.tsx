import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { useLanguage, type Lang } from '../../i18n';

interface ScreenHeaderProps {
  onBack?: () => void;
}

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'ENG' },
  { value: 'hi', label: 'हिंदी' },
];

export function ScreenHeader({ onBack }: ScreenHeaderProps) {
  const { lang, setLang, t } = useLanguage();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack}
        disabled={!onBack}
        accessibilityRole="button"
        accessibilityLabel={t('go_back')}
        style={styles.back}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <Text style={styles.backLabel}>{t('go_back')}</Text>
      </Pressable>

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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  back: { flexDirection: 'row', alignItems: 'center' },
  backLabel: { fontSize: 18, fontWeight: '700', color: colors.text, marginLeft: spacing.md },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  toggleItemActive: { backgroundColor: colors.primary },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  toggleLabelActive: { color: colors.surface },
});
