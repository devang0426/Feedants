import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../ui/Text';
import { Ionicons } from '@expo/vector-icons';
import type { CheckoutResult, Payment, ViewerSubmission } from '../../api/types';
import { RazorpayCheckout } from './RazorpayCheckout';
import { useLanguage } from '../../i18n';
import { useCountdown } from '../../hooks/useCountdown';
import { colors, radius, spacing, typography } from '../../theme';
import { formatCountdown, formatMoney } from '../../utils/format';
import { Button } from '../ui/Button';

/** Razorpay test-mode card shown inside the checkout sheet for demos. */
const DEMO_CARD_NUMBER = '4100 2800 0000 1007';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  children: React.ReactNode;
}

function Sheet({ visible, onClose, title, body, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={typography.h2}>{title}</Text>
          <Text style={[typography.bodySecondary, styles.body]}>{body}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface PaymentSheetProps {
  visible: boolean;
  payment: Payment | null;
  heldUntil: string | null;
  busy: boolean;
  description: string;
  prefill: { name?: string; email?: string };
  onPaid: (result: CheckoutResult) => void;
  onFailure: (message: string) => void;
  onClose: () => void;
}

/**
 * Payment step. With gateway keys configured the backend returns
 * `mode: "razorpay"` and the real Razorpay checkout is embedded; otherwise a
 * mock "Pay" button confirms with the demo signature.
 */
export function PaymentSheet({ visible, payment, heldUntil, busy, description, prefill, onPaid, onFailure, onClose }: PaymentSheetProps) {
  const { t, lang } = useLanguage();
  const hold = useCountdown(heldUntil);
  const amount = payment ? formatMoney(payment.amountPaise, payment.currency, lang) : '';
  const isRazorpay = payment?.mode === 'razorpay' && Boolean(payment.keyId);

  const holdLine =
    hold && !hold.isOver ? <Text style={styles.hold}>{t('spot_held_until', { date: formatCountdown(hold) })}</Text> : null;

  if (isRazorpay && payment) {
    const isTestKey = payment.keyId?.startsWith('rzp_test_');
    return (
      <Sheet visible={visible} onClose={onClose} title={t('payment_title')} body={t('payment_body')}>
        {holdLine}
        {isTestKey ? (
          <Text style={styles.testCard} selectable>
            {t('test_card_hint', { card: DEMO_CARD_NUMBER })}
          </Text>
        ) : null}
        <View style={styles.checkout}>
          {busy ? (
            <View style={styles.busy}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <RazorpayCheckout
              key={payment.orderId}
              payment={payment}
              description={description}
              prefill={prefill}
              onSuccess={onPaid}
              onDismiss={onClose}
              onFailure={onFailure}
            />
          )}
        </View>
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={t('payment_title')} body={t('payment_body')}>
      <View style={styles.summaryRow}>
        <View style={styles.providerRow}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={styles.provider}>{payment?.provider === 'mock' ? 'Razorpay (demo)' : payment?.provider ?? 'Razorpay'}</Text>
        </View>
        <Text style={styles.amount}>{amount}</Text>
      </View>
      {payment?.orderId ? <Text style={styles.orderId}>Order {payment.orderId}</Text> : null}
      {holdLine}
      <Button
        label={t('pay_now', { amount })}
        size="lg"
        loading={busy}
        onPress={() => onPaid({ paymentId: `pay_demo_${Date.now()}`, orderId: payment?.orderId, signature: 'mock' })}
        style={styles.cta}
      />
      <Text style={styles.note}>{t('payment_mock_note')}</Text>
    </Sheet>
  );
}

interface SubmissionSheetProps {
  visible: boolean;
  existing: ViewerSubmission | null;
  busy: boolean;
  onSubmit: (values: { title?: string; mediaUrl: string }) => void;
  onClose: () => void;
}

export function SubmissionSheet({ visible, existing, busy, onSubmit, onClose }: SubmissionSheetProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(existing?.title ?? '');
      setMediaUrl(existing?.mediaUrl ?? '');
    }
  }, [visible, existing]);

  const isValid = /^https?:\/\/\S+$/i.test(mediaUrl.trim());

  return (
    <Sheet visible={visible} onClose={onClose} title={t('submission_title')} body={t('submission_body')}>
      <Text style={styles.inputLabel}>{t('submission_title_label')}</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} maxLength={120} placeholder="Kathak solo" placeholderTextColor={colors.textMuted} />
      <Text style={styles.inputLabel}>{t('submission_url_label')}</Text>
      <TextInput
        value={mediaUrl}
        onChangeText={setMediaUrl}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://"
        placeholderTextColor={colors.textMuted}
      />
      <Button
        label={t('submit')}
        size="lg"
        loading={busy}
        disabled={!isValid}
        onPress={() => onSubmit({ title: title.trim() || undefined, mediaUrl: mediaUrl.trim() })}
        style={styles.cta}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginBottom: spacing.lg },
  body: { marginTop: spacing.xs, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primarySofter, borderRadius: radius.md, padding: spacing.md },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  provider: { fontSize: 14, fontWeight: '600', color: colors.text },
  amount: { fontSize: 18, fontWeight: '700', color: colors.primary },
  orderId: { ...typography.captionMuted, marginTop: spacing.sm },
  hold: { ...typography.caption, color: colors.warning, marginTop: spacing.sm, fontWeight: '600' },
  checkout: { marginTop: spacing.md },
  testCard: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  busy: { height: 200, alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: spacing.lg },
  note: { ...typography.captionMuted, textAlign: 'center', marginTop: spacing.md },
  inputLabel: { ...typography.caption, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.text },
});
