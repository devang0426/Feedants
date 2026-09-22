import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus, Platform, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
// Per-weight subpath imports so only the five faces we use are bundled.
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_400Regular_Italic } from '@expo-google-fonts/poppins/400Regular_Italic';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { LanguageProvider, useLanguage } from './src/i18n';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { setRequestLang } from './src/api/client';
import { RootNavigator } from './src/navigation';
import { LoadingState, ErrorState } from './src/components/ui/StateViews';
import { ToastProvider } from './src/components/ui/Toast';
import { colors } from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnReconnect: true },
  },
});

/** Re-fetch when the app returns to the foreground so state is never stale. */
function useAppFocus() {
  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
}

/** Keeps the API client's language in sync with the UI toggle. */
function LanguageSync() {
  const { lang } = useLanguage();
  useEffect(() => {
    setRequestLang(lang);
    void queryClient.invalidateQueries({ queryKey: ['competitions'] });
  }, [lang]);
  return null;
}

function Gate() {
  const { isReady, error, retry } = useAuth();
  const { t } = useLanguage();
  useAppFocus();
  // Design typeface. If loading fails (fontError) we continue with the system
  // font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!isReady || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.fill}>
        <LoadingState message={t('loading')} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.fill}>
        <ErrorState title={t('error_title')} message={error} hint={t('offline_hint')} retryLabel={t('retry')} onRetry={retry} />
      </View>
    );
  }
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <LanguageSync />
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Gate />
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
});
