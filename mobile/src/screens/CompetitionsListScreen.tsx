import React from 'react';
import { Alert, FlatList, Image, Platform, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from '../components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { CompetitionSummary, Phase } from '../api/types';
import { useCompetitionList } from '../hooks/useCompetition';
import { useLanguage } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { isApiError } from '../api/client';
import { colors, radius, spacing, typography } from '../theme';
import { formatMoney, formatShortDate } from '../utils/format';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { LoadingState, ErrorState } from '../components/ui/StateViews';
import { ScreenHeader } from '../components/competition/ScreenHeader';
import { BottomTabBar } from '../components/competition/BottomTabBar';

type Props = NativeStackScreenProps<RootStackParamList, 'CompetitionsList'>;

const PHASE_TONE: Record<Phase, 'neutral' | 'success' | 'warning' | 'danger'> = {
  draft: 'neutral',
  cancelled: 'danger',
  upcoming: 'neutral',
  registration_open: 'success',
  registration_closed: 'warning',
  submission_open: 'warning',
  judging: 'warning',
  results_announced: 'neutral',
};

function CompetitionRow({ item, onPress }: { item: CompetitionSummary; onPress: () => void }) {
  const { t, lang } = useLanguage();
  const spotsTone = item.capacity.isFull ? styles.full : undefined;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      <Card style={styles.row}>
        {item.judgeAvatarUrl ? (
          <Image source={{ uri: item.judgeAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="trophy-outline" size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={typography.caption} numberOfLines={1}>
            {item.category} · {item.judgeName ?? ''}
          </Text>
          <View style={styles.meta}>
            <Chip label={t(`phase_${item.phase}`)} tone={PHASE_TONE[item.phase]} />
            <Text style={[typography.caption, spotsTone]}>
              {item.capacity.isFull ? t('spots_full') : t('booked', { booked: item.capacity.booked, total: item.capacity.total })}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.fee}>{item.entryFeePaise === 0 ? t('free') : formatMoney(item.entryFeePaise, item.currency, lang)}</Text>
          <Text style={typography.captionMuted}>{formatShortDate(item.registrationClosesAt, lang)}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

export function CompetitionsListScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const { user, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const query = useCompetitionList();

  /**
   * Demo helper to show multi-user consistency (e.g. one user books the last
   * spot, another sees "Competition Full"). iOS gets a free-text prompt;
   * Android's Alert has no text input so it offers preset demo accounts.
   */
  const switchUser = () => {
    const attempt = async (email: string, name?: string) => {
      try {
        await signIn(email.trim(), name);
      } catch (err) {
        Alert.alert(t('error_title'), isApiError(err) ? err.message : String(err));
      }
    };
    if (Platform.OS === 'ios') {
      Alert.prompt(t('switch_user'), t('switch_user_body'), (email) => email && attempt(email), 'plain-text', user?.email);
      return;
    }
    Alert.alert(t('switch_user'), t('switch_user_body'), [
      { text: 'demo@feedants.app', onPress: () => attempt('demo@feedants.app', 'Devang') },
      { text: 'asha@feedants.app', onPress: () => attempt('asha@feedants.app', 'Asha Patel') },
      { text: 'guest@feedants.app', onPress: () => attempt('guest@feedants.app', 'Guest') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <View style={styles.headerRow}>
        <Text style={typography.h1}>{t('competitions')}</Text>
        {user ? (
          <Pressable onPress={switchUser} style={styles.user} accessibilityRole="button">
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.userText}>{t('session_as', { name: user.name })}</Text>
          </Pressable>
        ) : null}
      </View>

      {query.isPending ? (
        <LoadingState message={t('loading')} />
      ) : query.isError ? (
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
      <BottomTabBar active="competitions" avatarUrl={user?.avatarUrl} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headerRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.xs },
  user: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  userText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.chip },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  full: { color: colors.danger, fontWeight: '600' },
  right: { alignItems: 'flex-end', gap: 2 },
  fee: { fontSize: 15, fontWeight: '700', color: colors.primary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { ...typography.h2, marginTop: spacing.sm },
});
