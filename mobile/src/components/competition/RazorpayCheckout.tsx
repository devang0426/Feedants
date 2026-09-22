import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
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

type CheckoutMessage =
  | { type: 'ready' }
  | { type: 'opened' }
  | { type: 'success'; payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string } }
  | { type: 'dismiss' }
  | { type: 'failed'; payload?: { description?: string } }
  | { type: 'error'; message?: string };

/** If checkout.js has not reported in by then, show a retry instead of a blank sheet. */
const READY_TIMEOUT_MS = 10_000;

/**
 * Razorpay Standard Checkout hosted inside a WebView (works in Expo Go; the
 * native SDK needs a custom build). The page reports back through
 * `window.ReactNativeWebView.postMessage`; the backend verifies the
 * signature before confirming the spot.
 */
export function RazorpayCheckout({ payment, description, prefill, onSuccess, onDismiss, onFailure }: RazorpayCheckoutProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'opened' | 'stalled'>('loading');
  const [attempt, setAttempt] = useState(0);
  const webviewRef = useRef<WebView>(null);

  const html = useMemo(() => {
    const options = {
      key: payment.keyId,
      amount: payment.amountPaise,
      currency: payment.currency,
      order_id: payment.orderId,
      name: 'Feedants',
      description,
      prefill,
      theme: { color: colors.primary },
      retry: { enabled: true },
    };
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>html,body{margin:0;height:100%;background:#fff;font-family:sans-serif}</style>
  </head>
  <body>
    <script>
      var post = function (msg) {
        if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
      };
      window.onerror = function (m) { post({ type: 'error', message: String(m) }); };
      var rzp = null;
      window.openCheckout = function () {
        try {
          if (!window.Razorpay) { post({ type: 'error', message: 'checkout.js not loaded' }); return; }
          if (!rzp) {
            var options = ${JSON.stringify(options)};
            options.handler = function (response) { post({ type: 'success', payload: response }); };
            options.modal = { ondismiss: function () { post({ type: 'dismiss' }); }, escape: true, confirm_close: true };
            rzp = new Razorpay(options);
            rzp.on('payment.failed', function (r) { post({ type: 'failed', payload: r && r.error }); });
          }
          rzp.open();
          post({ type: 'opened' });
        } catch (e) {
          post({ type: 'error', message: String(e) });
        }
      };
    </script>
    <script src="https://checkout.razorpay.com/v1/checkout.js"
            onload="post({ type: 'ready' }); window.openCheckout();"
            onerror="post({ type: 'error', message: 'Could not load checkout.js' })"></script>
  </body>
</html>`;
  }, [payment, description, prefill]);

  // Stall detection: a blank sheet is the worst outcome, so surface a retry.
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setTimeout(() => setPhase((p) => (p === 'loading' ? 'stalled' : p)), READY_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [phase, attempt]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: CheckoutMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as CheckoutMessage;
    } catch {
      return;
    }
    switch (message.type) {
      case 'ready':
        setPhase('ready');
        break;
      case 'opened':
        setPhase('opened');
        break;
      case 'success':
        onSuccess({
          paymentId: message.payload.razorpay_payment_id,
          orderId: message.payload.razorpay_order_id,
          signature: message.payload.razorpay_signature,
        });
        break;
      case 'dismiss':
        onDismiss();
        break;
      case 'failed':
        onFailure(message.payload?.description ?? 'Payment failed');
        break;
      case 'error':
        setPhase('stalled');
        onFailure(message.message ?? 'Could not open checkout');
        break;
    }
  };

  const retry = () => {
    setPhase('loading');
    setAttempt((n) => n + 1);
    webviewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      <WebView
        key={`${payment.orderId}-${attempt}`}
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://feedants.com' }}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        mixedContentMode="always"
        // Razorpay renders in an iframe and some banks open a new window; keep
        // everything inside this single WebView on Android.
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically
        allowsInlineMediaPlayback
        onMessage={handleMessage}
        onError={() => {
          setPhase('stalled');
          onFailure('Could not load checkout');
        }}
        onShouldStartLoadWithRequest={(req) => {
          // UPI / bank apps use custom schemes; hand those to the OS.
          if (/^(https?:|about:|data:)/i.test(req.url)) return true;
          Linking.openURL(req.url).catch(() => undefined);
          return false;
        }}
        style={styles.webview}
      />
      {phase === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
      {phase === 'stalled' ? (
        <View style={styles.overlay}>
          <Text style={[typography.bodySecondary, styles.stalledText]}>The payment page did not load.</Text>
          <Button label="Try again" variant="outline" onPress={retry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 520, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  webview: { flex: 1, backgroundColor: colors.surface },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: spacing.md,
    padding: spacing.xl,
  },
  stalledText: { textAlign: 'center' },
});
