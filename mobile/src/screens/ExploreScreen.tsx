import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { Phase } from '../api/types';
import { useCategories, useCompetitionList } from '../hooks/useCompetition';
import { useLanguage } from '../i18n';
import { isApiError } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';
import { Text } from '../components/ui/Text';
import { ErrorState, LoadingState } from '../components/ui/StateViews';
import { ScreenHeader } from '../components/competition/ScreenHeader';
import { CompetitionRow } from '../components/competition/CompetitionRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PHASES: { key: Phase | undefined; labelKey: string }[] = [
  { key: undefined, labelKey: 'all' },
  { key: 'registration_open', labelKey: 'phase_registration_open' },
  { key: 'upcoming', labelKey: 'phase_upcoming' },
  { key: 'submission_open', labelKey: 'phase_submission_open' },
  { key: 'judging', labelKey: 'phase_judging' },
  { key: 'results_announced', labelKey: 'phase_results_announced' },
];

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function ExploreScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [phase, setPhase] = useState<Phase | undefined>();
  const q = useDebounced(search.trim());

  const categories = useCategories();
  const query = useCompetitionList({ q: q || undefined, category, phase });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <View style={styles.header}>
        <Text style={typography.h1}>{t('explore_title')}</Text>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('search_placeholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={t('search_placeholder')}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
        <FilterChip label={t('all')} active={!category} onPress={() => setCategory(undefined)} />
        {(categories.data ?? []).map((c) => (
          <FilterChip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(category === c.key ? undefined : c.key)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
        {PHASES.map((p) => (
          <FilterChip key={p.labelKey} label={t(p.labelKey)} active={phase === p.key} onPress={() => setPhase(p.key)} />
        ))}
      </ScrollView>

      {query.isPending ? (
        <LoadingState message={t('loading')} />
      ) : query.isError && !query.data ? (
        <ErrorState
          title={t('error_title')}
          message={isApiError(query.error) ? query.error.message : undefined}
          hint={t('offline_hint')}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
              <Text style={[typography.h2, { marginTop: spacing.sm }]}>{t('no_results')}</Text>
              <Text style={typography.caption}>{t('no_results_sub')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CompetitionRow item={item} onPress={() => navigation.navigate('CompetitionDetails', { idOrSlug: item.slug })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, gap: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 },
  chipScroll: { flexGrow: 0, marginTop: spacing.md },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.surface },
  list: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.xs },
});
