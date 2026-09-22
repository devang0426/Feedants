import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n';
import { colors, hairline, spacing } from '../../theme';
import { Text } from '../ui/Text';

type TabKey = 'home' | 'explore' | 'create' | 'competitions' | 'profile';

interface BottomTabBarProps {
  active: TabKey;
  avatarUrl?: string | null;
  onPress?: (tab: TabKey) => void;
}

/** Minimal tab bar: hairline top, outline icons, filled icon + teal label when active. */
export function BottomTabBar({ active, avatarUrl, onPress }: BottomTabBarProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const items: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'home', label: t('home'), icon: 'home-outline', activeIcon: 'home' },
    { key: 'explore', label: t('explore'), icon: 'search-outline', activeIcon: 'search' },
    { key: 'create', label: '', icon: 'add', activeIcon: 'add' },
    { key: 'competitions', label: t('competitions'), icon: 'trophy-outline', activeIcon: 'trophy' },
    { key: 'profile', label: t('profile'), icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {items.map((item) => {
        const isActive = item.key === active;
        const color = isActive ? colors.primary : colors.textMuted;
        if (item.key === 'create') {
          return (
            <Pressable key={item.key} onPress={() => onPress?.(item.key)} style={styles.item} accessibilityRole="button" accessibilityLabel="Create">
              <View style={[styles.plus, isActive && styles.plusActive]}>
                <Ionicons name="add" size={22} color={isActive ? colors.surface : colors.primary} />
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable key={item.key} onPress={() => onPress?.(item.key)} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: isActive }}>
            {item.key === 'profile' && avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatar, isActive && styles.avatarActive]} />
            ) : (
              <Ionicons name={isActive ? item.activeIcon : item.icon} size={22} color={color} />
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
    borderTopWidth: hairline,
    borderTopColor: colors.borderStrong,
    paddingTop: spacing.sm,
  },
  item: { alignItems: 'center', justifyContent: 'center', minWidth: 56, paddingTop: 2 },
  label: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  plus: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  plusActive: { backgroundColor: colors.primary },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.chip },
  avatarActive: { borderWidth: 1.5, borderColor: colors.primary },
});
