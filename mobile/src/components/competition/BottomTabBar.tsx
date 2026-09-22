import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n';
import { colors, spacing } from '../../theme';

type TabKey = 'home' | 'explore' | 'create' | 'competitions' | 'profile';

interface BottomTabBarProps {
  active: TabKey;
  avatarUrl?: string | null;
  onPress?: (tab: TabKey) => void;
}

/**
 * Visual bottom navigation matching the reference. Only the Competitions
 * tab is wired in this module; the others are placeholders.
 */
export function BottomTabBar({ active, avatarUrl, onPress }: BottomTabBarProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const items: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: t('home'), icon: 'home-outline' },
    { key: 'explore', label: t('explore'), icon: 'search-outline' },
    { key: 'create', label: '', icon: 'add' },
    { key: 'competitions', label: t('competitions'), icon: 'trophy-outline' },
    { key: 'profile', label: t('profile'), icon: 'person-circle-outline' },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {items.map((item) => {
        const isActive = item.key === active;
        const color = isActive ? colors.primary : colors.textSecondary;
        if (item.key === 'create') {
          return (
            <Pressable key={item.key} onPress={() => onPress?.(item.key)} style={styles.item} accessibilityRole="button" accessibilityLabel="Create">
              <View style={styles.fab}>
                <Ionicons name="add" size={26} color={colors.surface} />
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable key={item.key} onPress={() => onPress?.(item.key)} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: isActive }}>
            {item.key === 'profile' && avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatar, isActive && styles.avatarActive]} />
            ) : (
              <Ionicons name={item.icon} size={24} color={color} />
            )}
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  label: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  fab: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.chip },
  avatarActive: { borderWidth: 2, borderColor: colors.primary },
});
