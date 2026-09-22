import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Sentinel used when the app is tunnelled but no API URL was configured. It
 * fails fast with a clear host name instead of silently timing out against a
 * port that is not there.
 */
const TUNNEL_WITHOUT_API = 'http://api-url-not-configured.invalid/api/v1';

/** Backend port used when the host is derived from the Expo dev server. */
const API_PORT = 4000;

const isIpAddress = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

/**
 * Resolves the API base URL:
 *  1. EXPO_PUBLIC_API_URL (set in .env) always wins.
 *  2. Otherwise derive the LAN host from the Expo dev server so a physical
 *     device on the same Wi-Fi reaches the backend without configuration.
 *  3. Android emulator maps the host loopback to 10.0.2.2.
 *
 * Tunnel mode (`expo start --tunnel`) is deliberately NOT guessed: the dev
 * server is reached through a relay host that has no port 4000 behind it, so
 * deriving from it would produce a URL that always fails. In that case the
 * backend must be exposed separately and given via EXPO_PUBLIC_API_URL.
 */
function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ?? (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host && isIpAddress(host) && host !== '127.0.0.1') {
    return `http://${host}:${API_PORT}/api/v1`;
  }

  if (host && !isIpAddress(host) && host !== 'localhost') {
    // A named host means a tunnel; there is nothing sensible to derive.
    console.warn(
      `[config] Expo is running through a tunnel (${host}). The backend cannot be ` +
        'reached automatically. Expose it publicly (e.g. "ngrok http 4000") and set ' +
        'EXPO_PUBLIC_API_URL in mobile/.env to that URL + /api/v1.'
    );
    return TUNNEL_WITHOUT_API;
  }

  if (Platform.OS === 'android') return `http://10.0.2.2:${API_PORT}/api/v1`;
  return `http://localhost:${API_PORT}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** True when the app has no usable backend URL and the user must set one. */
export const API_URL_MISCONFIGURED = API_BASE_URL === TUNNEL_WITHOUT_API;

/** How often the details screen re-syncs with the server (ms). */
export const DETAILS_POLL_INTERVAL_MS = 15_000;
