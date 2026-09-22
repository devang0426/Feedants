import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../i18n';
import { isApiError } from '../api/client';
import { DEMO_USER } from '../config';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useToast } from '../components/ui/Toast';
import { ScreenHeader } from '../components/competition/ScreenHeader';

const DEMO_ACCOUNTS = [
  { email: DEMO_USER.email, name: DEMO_USER.name },
  { email: 'asha@feedants.app', name: 'Asha Patel' },
  { email: 'rohan@feedants.app', name: 'Rohan Gupta' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInScreen() {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(DEMO_USER.email);
  const [name, setName] = useState(DEMO_USER.name);
  const [busy, setBusy] = useState(false);

  const submit = async (e = email, n = name) => {
    if (!EMAIL_RE.test(e.trim())) {
      toast.show(t('error_title'), 'error');
      return;
    }
    setBusy(true);
    try {
      await signIn(e, n.trim() || undefined);
    } catch (err) {
      toast.show(isApiError(err) ? err.message : t('error_title'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="trophy-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brand}>Feedants</Text>
            <Text style={[typography.h1, styles.title]}>{t('sign_in_title')}</Text>
            <Text style={[typography.bodySecondary, styles.body]}>{t('sign_in_body')}</Text>
          </View>

          <Card>
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
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={() => submit()}
              returnKeyType="go"
            />
            <Button label={t('sign_in')} size="lg" loading={busy} onPress={() => submit()} style={styles.cta} />
          </Card>

          <Text style={styles.hint}>{t('sign_in_demo_hint')}</Text>
          <View style={styles.demoRow}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.email}
                onPress={() => {
                  setEmail(acc.email);
                  setName(acc.name);
                  void submit(acc.email, acc.name);
                }}
                disabled={busy}
                style={({ pressed }) => [styles.demoChip, pressed && styles.demoChipPressed]}
                accessibilityRole="button"
              >
                <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.demoText}>{acc.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  hero: { alignItems: 'center', paddingVertical: spacing.xxl },
  logo: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: spacing.md, letterSpacing: 0.4 },
  title: { marginTop: spacing.lg, textAlign: 'center' },
  body: { marginTop: spacing.sm, textAlign: 'center' },
  label: { ...typography.eyebrow, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderBottomWidth: 1, borderBottomColor: colors.borderStrong, paddingHorizontal: 0, paddingVertical: 10, fontSize: 15, color: colors.text },
  cta: { marginTop: spacing.xxl },
  hint: { ...typography.captionMuted, marginTop: spacing.xl, marginBottom: spacing.sm, textAlign: 'center' },
  demoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  demoChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  demoChipPressed: { backgroundColor: colors.primarySofter },
  demoText: { fontSize: 12.5, fontWeight: '500', color: colors.textSecondary },
});
