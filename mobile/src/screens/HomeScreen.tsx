import React, { useMemo } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { CompetitionSummary } from '../api/types';
import { useCompetitionList } from '../hooks/useCompetition';
import { useCountdown } from '../hooks/useCountdown';
import { useLanguage } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { isApiError } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';
import { formatCountdown, formatMoney } from '../utils/format';
import { Text } from '../components/ui/Text';
import { ErrorState } from '../components/ui/StateViews';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { ScreenHeader } from '../components/competition/ScreenHeader';
import { CompetitionRow } from '../components/competition/CompetitionRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Featured card for competitions whose registration closes soonest. */
function ClosingSoonCard({ item, onPress }: { item: CompetitionSummary; onPress: () => void }) {
  const { t, lang } = useLanguage();
  const countdown = useCountdown(item.registrationClosesAt);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.feature, pressed && styles.pressed]}>
      <View style={styles.featureTop}>
        {item.judgeAvatarUrl ? <Image source={{ uri: item.judgeAvatarUrl }} style={styles.featureAvatar} /> : null}
        <View style={styles.featureBadge}>
          <Ionicons name="time-outline" size={12} color={colors.surface} />
          <Text style={styles.featureBadgeText}>
            {countdown ? t('closes_in', { time: formatCountdown(countdown) }) : ''}
          </Text>
        </View>
      </View>
      <Text style={styles.featureTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.featureMeta}>
        <Text style={styles.featurePrize}>{formatMoney(item.prizePoolPaise, item.currency, lang)}</Text>
        <Text style={styles.featureSpots}>
          {item.capacity.isFull ? t('spots_full') : t('spots_left', { n: item.capacity.spotsLeft })}
        </Text>
      </View>
    </Pressable>
  );
}

function Section({ title, onViewAll, children }: { title: string; onViewAll?: () => void; children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={typography.h2}>{title}</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.viewAll}>{t('view_all')}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const query = useCompetitionList();

  const groups = useMemo(() => {
    const all = query.data ?? [];
    const open = all.filter((c) => c.phase === 'registration_open' && !c.capacity.isFull);
    return {
      closingSoon: [...open].sort((a, b) => +new Date(a.registrationClosesAt) - +new Date(b.registrationClosesAt)).slice(0, 4),
      open,
      upcoming: all.filter((c) => c.phase === 'upcoming'),
      results: all.filter((c) => c.phase === 'results_announced'),
    };
  }, [query.data]);

  const openDetails = (c: CompetitionSummary) => navigation.navigate('CompetitionDetails', { idOrSlug: c.slug });
  const goToList = () => navigation.navigate('MainTabs', { screen: 'Competitions' });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={typography.h1}>{t('home_greeting', { name: user?.name?.split(' ')[0] ?? '' })}</Text>
          <Text style={typography.bodySecondary}>{t('home_tagline')}</Text>
        </View>

        {query.isPending ? (
          <View style={styles.skeleton}>
            <SkeletonBlock height={150} style={{ borderRadius: radius.lg }} />
            <SkeletonBlock height={84} style={{ borderRadius: radius.lg }} />
            <SkeletonBlock height={84} style={{ borderRadius: radius.lg }} />
          </View>
        ) : query.isError && !query.data ? (
          <ErrorState
            title={t('error_title')}
            message={isApiError(query.error) ? query.error.message : undefined}
            hint={t('offline_hint')}
            retryLabel={t('retry')}
            onRetry={() => query.refetch()}
          />
        ) : (
          <>
            {groups.closingSoon.length ? (
              <Section title={t('closing_soon')} onViewAll={goToList}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRow}>
                  {groups.closingSoon.map((c) => (
                    <ClosingSoonCard key={c.id} item={c} onPress={() => openDetails(c)} />
                  ))}
                </ScrollView>
              </Section>
            ) : null}
            {groups.open.length ? (
              <Section title={t('open_now')} onViewAll={goToList}>
                <View style={styles.list}>
                  {groups.open.map((c) => (
                    <CompetitionRow key={c.id} item={c} onPress={() => openDetails(c)} />
                  ))}
                </View>
              </Section>
            ) : null}
            {groups.upcoming.length ? (
              <Section title={t('upcoming_section')}>
                <View style={styles.list}>
                  {groups.upcoming.map((c) => (
                    <CompetitionRow key={c.id} item={c} onPress={() => openDetails(c)} />
                  ))}
                </View>
              </Section>
            ) : null}
            {groups.results.length ? (
              <Section title={t('results_section')}>
                <View style={styles.list}>
                  {groups.results.map((c) => (
                    <CompetitionRow key={c.id} item={c} onPress={() => openDetails(c)} />
                  ))}
                </View>
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  greeting: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 2 },
  skeleton: { padding: spacing.lg, gap: spacing.md },
  section: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  viewAll: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md },
  featureRow: { paddingHorizontal: spacing.lg, gap: spacing.md },
  feature: { width: 240, backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  pressed: { opacity: 0.9 },
  featureTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featureAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  featureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  featureBadgeText: { color: colors.surface, fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  featureTitle: { color: colors.surface, fontSize: 17, fontWeight: '700', marginTop: spacing.xs, minHeight: 48 },
  featureMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featurePrize: { color: colors.surface, fontSize: 18, fontWeight: '700' },
  featureSpots: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
});
