import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the API base URL:
 *  1. EXPO_PUBLIC_API_URL (set in .env) always wins.
 *  2. Otherwise derive the LAN host from the Expo dev server so a physical
 *     device on the same Wi-Fi reaches the backend without configuration.
 *  3. Android emulator maps the host loopback to 10.0.2.2.
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:4000/api/v1`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000/api/v1';
  return 'http://localhost:4000/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const DEMO_USER = {
  email: process.env.EXPO_PUBLIC_DEMO_EMAIL ?? 'demo@feedants.app',
  name: process.env.EXPO_PUBLIC_DEMO_NAME ?? 'Devang',
};

/** How often the details screen re-syncs with the server (ms). */
export const DETAILS_POLL_INTERVAL_MS = 15_000;
