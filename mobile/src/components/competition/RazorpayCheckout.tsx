import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { CheckoutResult, Payment } from '../../api/types';
import { colors } from '../../theme';

interface RazorpayCheckoutProps {
  payment: Payment;
  description: string;
  prefill: { name?: string; email?: string };
  onSuccess: (result: CheckoutResult) => void;
  onDismiss: () => void;
  onFailure: (message: string) => void;
}

type CheckoutMessage =
  | { type: 'success'; payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string } }
  | { type: 'dismiss' }
  | { type: 'failed'; payload?: { description?: string } }
  | { type: 'error'; message?: string };

/**
 * Razorpay Standard Checkout hosted inside a WebView. This keeps the app
 * runnable in Expo Go (the native SDK needs a custom build). The page posts
 * the checkout result back through `window.ReactNativeWebView.postMessage`,
 * and the backend verifies the signature before confirming the spot.
 */
export function RazorpayCheckout({ payment, description, prefill, onSuccess, onDismiss, onFailure }: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(true);

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
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  </head>
  <body style="margin:0;background:#ffffff">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      var post = function (msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); };
      try {
        var options = ${JSON.stringify(options)};
        options.handler = function (response) { post({ type: 'success', payload: response }); };
        options.modal = { ondismiss: function () { post({ type: 'dismiss' }); }, escape: true, confirm_close: true };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (r) { post({ type: 'failed', payload: r && r.error }); });
        rzp.open();
      } catch (e) {
        post({ type: 'error', message: String(e) });
      }
    </script>
  </body>
</html>`;
  }, [payment, description, prefill]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: CheckoutMessage;
    try {
      message = JSON.parse(event.nativeEvent.data) as CheckoutMessage;
    } catch {
      return;
    }
    switch (message.type) {
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
        onFailure(message.message ?? 'Could not open checkout');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://feedants.com' }}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
        onError={() => onFailure('Could not load checkout')}
        // UPI / bank apps open via custom schemes; hand those to the OS.
        onShouldStartLoadWithRequest={(req) => {
          if (/^(https?:|about:)/.test(req.url)) return true;
          Linking.openURL(req.url).catch(() => undefined);
          return false;
        }}
        style={styles.webview}
      />
      {loading ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 520, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface },
  webview: { flex: 1, backgroundColor: colors.surface },
  loader: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
