import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/types';
import type { MyRegistration, RegistrationStatus } from '../api/types';
import { useMyRegistrations } from '../hooks/useCompetition';
import { useLanguage, type Lang } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { colors, radius, spacing, typography } from '../theme';
import { formatMoney } from '../utils/format';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { CompetitionRow } from '../components/competition/CompetitionRow';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TONE: Record<RegistrationStatus, 'neutral' | 'success' | 'warning' | 'danger'> = {
  pending: 'neutral',
  reserved: 'warning',
  confirmed: 'success',
  expired: 'danger',
  cancelled: 'neutral',
  failed: 'danger',
};

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'ENG' },
  { value: 'hi', label: 'हिंदी' },
];

function RegistrationItem({ item, onPress }: { item: MyRegistration; onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <CompetitionRow
      item={item.competition}
      onPress={onPress}
      trailing={<Chip label={t(`status_${item.status}`)} tone={STATUS_TONE[item.status]} />}
    />
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { t, lang, setLang } = useLanguage();
  const { user, signOut } = useAuth();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const registrations = useMyRegistrations();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  if (!user) return null;

  const copyLink = async () => {
    await Clipboard.setStringAsync(user.referral.link);
    setCopied(true);
    toast.show(t('copied'), 'success');
  };

  const confirmSignOut = () => {
    Alert.alert(t('sign_out'), user.email, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('sign_out'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const active = (registrations.data ?? []).filter((r) => r.isActive);
  const past = (registrations.data ?? []).filter((r) => !r.isActive);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={registrations.isRefetching} onRefresh={() => registrations.refetch()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.h1, styles.title]}>{t('profile_title')}</Text>

        <Card>
          <View style={styles.identity}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={30} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.identityText}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={typography.bodySecondary}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.langRow}>
            <Text style={typography.caption}>{t('language')}</Text>
            <View style={styles.toggle}>
              {LANGS.map((opt) => {
                const isActive = opt.value === lang;
                return (
                  <Pressable key={opt.value} onPress={() => setLang(opt.value)} style={[styles.toggleItem, isActive && styles.toggleItemActive]} accessibilityRole="radio" accessibilityState={{ selected: isActive }}>
                    <Text style={[styles.toggleLabel, isActive && styles.toggleLabelActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        <Card tone="green">
          <View style={styles.referralHeader}>
            <Ionicons name="gift-outline" size={22} color={colors.primary} />
            <Text style={typography.h2}>{t('referral_title')}</Text>
          </View>
          <View style={styles.referralStats}>
            <View style={styles.stat}>
              <Text style={typography.caption}>{t('referral_code')}</Text>
              <Text style={styles.statValue}>{user.referral.code}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={typography.caption}>{t('referral_earnings')}</Text>
              <Text style={styles.statValue}>{formatMoney(user.referral.earningsPaise, 'INR', lang)}</Text>
            </View>
          </View>
          <Pressable onPress={copyLink} style={styles.linkRow} accessibilityRole="button" accessibilityLabel={t('copy_link')}>
            <Text style={styles.link} numberOfLines={1} ellipsizeMode="middle">
              {user.referral.link}
            </Text>
            <Text style={styles.copy}>{copied ? t('copied') : t('copy_link')}</Text>
          </Pressable>
        </Card>

        <Text style={[typography.h2, styles.sectionTitle]}>{t('my_registrations')}</Text>
        {registrations.isPending ? (
          <View style={styles.list}>
            <SkeletonBlock height={84} style={{ borderRadius: radius.lg }} />
            <SkeletonBlock height={84} style={{ borderRadius: radius.lg }} />
          </View>
        ) : !registrations.data?.length ? (
          <Card>
            <Text style={[typography.bodySecondary, styles.emptyText]}>{t('no_registrations')}</Text>
            <Button label={t('browse_competitions')} variant="outline" onPress={() => navigation.navigate('MainTabs', { screen: 'Competitions' })} />
          </Card>
        ) : (
          <View style={styles.list}>
            {[...active, ...past].map((r) => (
              <RegistrationItem key={r.id} item={r} onPress={() => navigation.navigate('CompetitionDetails', { idOrSlug: r.competition.slug })} />
            ))}
          </View>
        )}

        <Button label={t('sign_out')} variant="danger" onPress={confirmSignOut} style={styles.signOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { marginBottom: spacing.xs },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.chip },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  identityText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  toggle: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: radius.pill, padding: 3 },
  toggleItem: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  toggleItemActive: { backgroundColor: colors.primary },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  toggleLabelActive: { color: colors.surface },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  referralStats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  stat: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accentGreenBorder, overflow: 'hidden' },
  link: { flex: 1, fontSize: 12, color: colors.textSecondary, paddingHorizontal: spacing.md, paddingVertical: 9 },
  copy: { fontSize: 13, fontWeight: '700', color: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 9, borderLeftWidth: 1, borderLeftColor: colors.accentGreenBorder },
  sectionTitle: { marginTop: spacing.sm },
  list: { gap: spacing.md },
  emptyText: { marginBottom: spacing.md },
  signOut: { marginTop: spacing.lg },
});
