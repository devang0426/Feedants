import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import { useCompetitionList } from '../hooks/useCompetition';
import { useLanguage } from '../i18n';
import { isApiError } from '../api/client';
import { colors, spacing, typography } from '../theme';
import { Text } from '../components/ui/Text';
import { LoadingState, ErrorState } from '../components/ui/StateViews';
import { ScreenHeader } from '../components/competition/ScreenHeader';
import { CompetitionRow } from '../components/competition/CompetitionRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** All competitions in every lifecycle phase, soonest registration deadline first. */
export function CompetitionsListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const query = useCompetitionList();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <View style={styles.headerRow}>
        <Text style={typography.h1}>{t('competitions')}</Text>
      </View>

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
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t('empty_list')}</Text>
              <Text style={typography.caption}>{t('empty_list_sub')}</Text>
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
  headerRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { ...typography.h2, marginTop: spacing.sm },
});
