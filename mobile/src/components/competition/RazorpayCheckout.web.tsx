import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { CheckoutResult, Payment } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';

interface RazorpayCheckoutProps {
  payment: Payment;
  description: string;
  prefill: { name?: string; email?: string };
  onSuccess: (result: CheckoutResult) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(script);
  });
}

/**
 * Web (browser preview) implementation: react-native-webview has no web
 * build, so the Razorpay script is injected into the page and the checkout
 * modal is opened directly. Same props and callbacks as the native version.
 */
export function RazorpayCheckout({ payment, description, prefill, onSuccess, onDismiss, onFailure }: RazorpayCheckoutProps) {
  const [status, setStatus] = useState<'loading' | 'open' | 'failed'>('loading');
  const openedRef = useRef(false);

  const open = async () => {
    try {
      await loadScript();
      if (!window.Razorpay) throw new Error('Razorpay unavailable');
      const rzp = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amountPaise,
        currency: payment.currency,
        order_id: payment.orderId,
        name: 'Feedants',
        description,
        prefill,
        theme: { color: colors.primary },
        handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) =>
          onSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          }),
        modal: { ondismiss: onDismiss, escape: true },
      });
      rzp.on('payment.failed', (r) => onFailure(r.error?.description ?? 'Payment failed'));
      rzp.open();
      setStatus('open');
    } catch (err) {
      setStatus('failed');
      onFailure(err instanceof Error ? err.message : 'Could not open checkout');
    }
  };

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    void open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment.orderId]);

  return (
    <View style={styles.box}>
      {status === 'loading' ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={[typography.bodySecondary, styles.text]}>
        {status === 'open' ? 'Razorpay checkout is open in this window.' : 'Opening Razorpay checkout…'}
      </Text>
      <Button label="Open checkout again" variant="outline" onPress={() => void open()} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  text: { textAlign: 'center' },
});
