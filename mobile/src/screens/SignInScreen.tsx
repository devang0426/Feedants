import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../i18n';
import { authApi } from '../api/competitions';
import { isApiError } from '../api/client';
import type { DemoAccount } from '../api/types';
import { colors, hairline, radius, spacing, typography } from '../theme';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Text } from '../components/ui/Text';
import { useToast } from '../components/ui/Toast';
import { ScreenHeader } from '../components/competition/ScreenHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AccountCardProps {
  account: DemoAccount;
  busy: boolean;
  onPress: () => void;
}

/** One-click sign-in card for a seeded demo account. */
function AccountCard({ account, busy, onPress }: AccountCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`Sign in as ${account.name}`}
      style={({ pressed }) => [styles.account, pressed && styles.accountPressed, busy && styles.accountBusy]}
    >
      <Avatar seed={account.email} uri={account.avatarUrl} size={44} />
      <View style={styles.accountText}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={typography.captionMuted} numberOfLines={2}>
          {account.hint}
        </Text>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

export function SignInScreen() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const accounts = useQuery({
    queryKey: ['auth', 'demo-accounts'],
    queryFn: authApi.demoAccounts,
    staleTime: 5 * 60_000,
  });

  const submit = async (nextEmail: string, nextName?: string) => {
    if (!EMAIL_RE.test(nextEmail.trim())) {
      toast.show(t('invalid_email'), 'error');
      return;
    }
    setPending(nextEmail);
    try {
      await signIn(nextEmail, nextName);
    } catch (err) {
      toast.show(isApiError(err) ? err.message : t('error_title'), 'error');
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="trophy-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[typography.h1, styles.title]}>{t('sign_in_title')}</Text>
            <Text style={[typography.bodySecondary, styles.body]}>{t('sign_in_body')}</Text>
          </View>

          <Text style={[typography.eyebrow, styles.eyebrow]}>{t('one_click_sign_in')}</Text>

          {accounts.isPending ? (
            <View style={styles.accountsLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : accounts.isError ? (
            <View style={styles.accountsError}>
              <Text style={[typography.bodySecondary, styles.centerText]}>
                {isApiError(accounts.error) ? accounts.error.message : t('error_title')}
              </Text>
              <Text style={[typography.captionMuted, styles.centerText]}>{t('offline_hint')}</Text>
              <Button label={t('retry')} variant="outline" onPress={() => accounts.refetch()} style={styles.retry} />
            </View>
          ) : (
            <View style={styles.accounts}>
              {(accounts.data ?? []).map((account) => (
                <AccountCard
                  key={account.email}
                  account={account}
                  busy={pending === account.email}
                  onPress={() => void submit(account.email, account.name)}
                />
              ))}
            </View>
          )}

          <Pressable
            onPress={() => setShowManual((v) => !v)}
            accessibilityRole="button"
            style={styles.manualToggle}
            hitSlop={8}
          >
            <Text style={styles.manualToggleText}>{t('use_another_email')}</Text>
            <Ionicons name={showManual ? 'chevron-up' : 'chevron-down'} size={15} color={colors.primary} />
          </Pressable>

          {showManual ? (
            <View style={styles.manual}>
              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>{t('name')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                textContentType="name"
                placeholder={t('name')}
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => void submit(email, name.trim() || undefined)}
                returnKeyType="go"
              />
              <Button
                label={t('sign_in')}
                size="lg"
                loading={pending === email}
                disabled={busy && pending !== email}
                onPress={() => void submit(email, name.trim() || undefined)}
                style={styles.cta}
              />
              <Text style={[typography.captionMuted, styles.centerText]}>{t('no_password_note')}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: spacing.lg, textAlign: 'center' },
  body: { marginTop: spacing.sm, textAlign: 'center' },
  eyebrow: { marginBottom: spacing.md, marginTop: spacing.sm },
  accounts: { gap: spacing.sm },
  accountsLoading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  accountsError: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  retry: { marginTop: spacing.sm, minWidth: 140 },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: hairline,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  accountPressed: { backgroundColor: colors.primarySofter, borderColor: colors.primary },
  accountBusy: { opacity: 0.6 },
  accountText: { flex: 1, gap: 2 },
  accountName: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  manualToggleText: { fontSize: 13, fontWeight: '500', color: colors.primary },
  manual: { marginTop: spacing.sm },
  label: { ...typography.eyebrow, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  cta: { marginTop: spacing.xl, marginBottom: spacing.md },
  centerText: { textAlign: 'center' },
});
