import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/Text';
import { DetailsSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmDialog';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TAB_ROUTE, type RootStackParamList } from '../navigation/types';
import { useCompetitionActions, useCompetitionDetails } from '../hooks/useCompetition';
import { useServerNow } from '../hooks/useCountdown';
import { useLanguage } from '../i18n';
import { useAuth } from '../auth/AuthProvider';
import { isApiError } from '../api/client';
import type { CheckoutResult, Payment } from '../api/types';
import { colors, spacing } from '../theme';
import { ErrorState } from '../components/ui/StateViews';
import { ScreenHeader } from '../components/competition/ScreenHeader';
import { SummaryCard } from '../components/competition/SummaryCard';
import { JudgeCard } from '../components/competition/JudgeCard';
import { CountdownBanner } from '../components/competition/CountdownBanner';
import { ImportantDates } from '../components/competition/ImportantDates';
import { PreviousWinners } from '../components/competition/PreviousWinners';
import { InfoTabs } from '../components/competition/InfoTabs';
import { RewardsCard } from '../components/competition/RewardsCard';
import { DisclaimerBanner } from '../components/competition/DisclaimerBanner';
import { PaymentInfoCard } from '../components/competition/PaymentInfoCard';
import { ReferralCard } from '../components/competition/ReferralCard';
import { AdPlaceholder, TestimonialsRow } from '../components/competition/MiscRows';
import { PrimaryActionBar } from '../components/competition/PrimaryActionBar';
import { BottomTabBar } from '../components/competition/BottomTabBar';
import { PaymentSheet, SubmissionSheet } from '../components/competition/Sheets';

type Props = NativeStackScreenProps<RootStackParamList, 'CompetitionDetails'>;

export function CompetitionDetailsScreen({ route, navigation }: Props) {
  const { idOrSlug } = route.params;
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const now = useServerNow();

  const query = useCompetitionDetails(idOrSlug);
  const competition = query.data;
  const actions = useCompetitionActions(idOrSlug, competition?.id);

  const [paymentSheet, setPaymentSheet] = useState<{ visible: boolean; payment: Payment | null }>({
    visible: false,
    payment: null,
  });
  const [submissionSheetVisible, setSubmissionSheetVisible] = useState(false);

  const busy =
    actions.register.isPending ||
    actions.confirmPayment.isPending ||
    actions.cancel.isPending ||
    actions.submit.isPending;

  const toast = useToast();
  const confirm = useConfirm();

  const showError = useCallback(
    (err: unknown) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
      toast.show(isApiError(err) ? err.message : t('error_title'), 'error');
    },
    [t, toast]
  );

  const celebrate = useCallback(
    (message: string) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      toast.show(message, 'success');
    },
    [toast]
  );

  // If a held reservation expires while the payment sheet is open, close it.
  const reservation = competition?.viewer.registration;
  useEffect(() => {
    if (paymentSheet.visible && reservation?.status !== 'reserved') {
      setPaymentSheet({ visible: false, payment: null });
    }
  }, [paymentSheet.visible, reservation?.status]);

  const openPayment = useCallback(
    (payment: Payment | null) => setPaymentSheet({ visible: true, payment }),
    []
  );

  const handlePrimary = useCallback(async () => {
    if (!competition) return;
    const { type } = competition.viewer.primaryAction;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    try {
      switch (type) {
        case 'register': {
          const result = await actions.register.mutateAsync();
          if (result.registrationStatus === 'confirmed') {
            celebrate(t('success_registered'));
          } else {
            openPayment(result.payment ?? null);
          }
          break;
        }
        case 'complete_payment':
          openPayment(competition.viewer.registration?.payment ?? null);
          break;
        case 'upload_submission':
        case 'update_submission':
          setSubmissionSheetVisible(true);
          break;
        case 'view_results':
          toast.show(t('results_announced'), 'info');
          break;
        default:
          break;
      }
    } catch (err) {
      showError(err);
    }
  }, [competition, actions.register, openPayment, showError, celebrate, toast, t]);

  /**
   * Called by the checkout (real Razorpay via WebView, or the mock button)
   * with the payment id + signature. The backend verifies the signature and
   * confirms the held spot; the webhook independently confirms it too if
   * this request never arrives.
   */
  const handlePaid = useCallback(
    async (result: CheckoutResult) => {
      try {
        await actions.confirmPayment.mutateAsync({ paymentId: result.paymentId, signature: result.signature });
        setPaymentSheet({ visible: false, payment: null });
        celebrate(t('success_registered'));
      } catch (err) {
        setPaymentSheet({ visible: false, payment: null });
        showError(err);
      }
    },
    [actions.confirmPayment, showError, celebrate, t]
  );

  const handlePaymentFailure = useCallback(
    (message: string) => {
      setPaymentSheet({ visible: false, payment: null });
      toast.show(message, 'error');
    },
    [toast]
  );

  const handleCancel = useCallback(async () => {
    const ok = await confirm({
      title: t('cancel_confirm_title'),
      message: t('cancel_confirm_body'),
      confirmLabel: t('confirm'),
      cancelLabel: t('keep'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await actions.cancel.mutateAsync();
      celebrate(t('success_cancelled'));
    } catch (err) {
      showError(err);
    }
  }, [actions.cancel, confirm, showError, celebrate, t]);

  const handleSubmit = useCallback(
    async (values: { title?: string; mediaUrl: string }) => {
      try {
        await actions.submit.mutateAsync(values);
        setSubmissionSheetVisible(false);
        celebrate(t('success_submitted'));
      } catch (err) {
        showError(err);
      }
    },
    [actions.submit, showError, celebrate, t]
  );

  const goBack = useMemo(
    () =>
      navigation.canGoBack()
        ? () => navigation.goBack()
        : () => navigation.navigate('MainTabs', { screen: 'Competitions' }),
    [navigation]
  );

  if (query.isPending) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={goBack} />
        <DetailsSkeleton />
      </View>
    );
  }

  // A failed refetch keeps the last good data (rendered with a stale banner);
  // only a load with nothing cached shows the full error state.
  if (!competition) {
    const err = query.error;
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScreenHeader onBack={goBack} />
        <ErrorState
          title={t('error_title')}
          message={isApiError(err) ? err.message : undefined}
          hint={isApiError(err) && err.code === 'NETWORK_ERROR' ? t('offline_hint') : undefined}
          retryLabel={t('retry')}
          onRetry={() => query.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader onBack={goBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching && !busy} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {query.isError ? (
          <View style={styles.stale} accessibilityLiveRegion="polite">
            <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
            <Text style={styles.staleText}>{t('stale_banner')}</Text>
          </View>
        ) : null}
        <SummaryCard competition={competition} />
        {competition.judge ? <JudgeCard judge={competition.judge} /> : null}
        <CountdownBanner countdown={competition.countdown} />
        <ImportantDates competition={competition} now={now} />
        <PreviousWinners winners={competition.previousWinners} />
        <InfoTabs competition={competition} />
        <RewardsCard rewards={competition.rewards} currency={competition.currency} />
        <DisclaimerBanner text={competition.disclaimer} />
        <PaymentInfoCard media={competition.media} />
        <ReferralCard
          link={competition.referral.link}
          rewardPaise={competition.referral.rewardPaise}
          currency={competition.currency}
          competitionTitle={competition.title}
        />
        <TestimonialsRow url={competition.testimonialsUrl} />
        <AdPlaceholder />
      </ScrollView>

      <PrimaryActionBar competition={competition} busy={busy} onPrimary={handlePrimary} onCancel={handleCancel} />
      <BottomTabBar
        active="competitions"
        avatarUrl={user?.avatarUrl}
        onPress={(tab) => navigation.navigate('MainTabs', { screen: TAB_ROUTE[tab] })}
      />

      <PaymentSheet
        visible={paymentSheet.visible}
        payment={paymentSheet.payment ?? competition.viewer.registration?.payment ?? null}
        heldUntil={competition.viewer.registration?.expiresAt ?? null}
        busy={actions.confirmPayment.isPending}
        description={competition.title}
        prefill={{ name: user?.name, email: user?.email }}
        onPaid={handlePaid}
        onFailure={handlePaymentFailure}
        onClose={() => setPaymentSheet({ visible: false, payment: null })}
      />
      <SubmissionSheet
        visible={submissionSheetVisible}
        existing={competition.viewer.submission}
        busy={actions.submit.isPending}
        onSubmit={handleSubmit}
        onClose={() => setSubmissionSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  stale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  staleText: { fontSize: 12, fontWeight: '600', color: colors.warning, flex: 1 },
});
