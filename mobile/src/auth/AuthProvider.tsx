import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/competitions';
import { setAuthToken } from '../api/client';
import type { User } from '../api/types';
import { DEMO_USER } from '../config';

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  error: string | null;
  signIn: (email: string, name?: string) => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'feedants.token';

/**
 * Demo auth: restores a saved JWT, validates it with /auth/me, and otherwise
 * signs in as the configured demo user. Exposes `signIn` so the demo can
 * switch between users to show multi-user consistency.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const signIn = useCallback(async (email: string, name?: string) => {
    const { token, user: nextUser } = await authApi.demoLogin({ email, name });
    setAuthToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => undefined);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
        if (saved) {
          setAuthToken(saved);
          try {
            const me = await authApi.me();
            if (!cancelled) setUser(me);
            return;
          } catch {
            setAuthToken(null);
          }
        }
        await signIn(DEMO_USER.email, DEMO_USER.name);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Sign-in failed');
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signIn, attempt]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isReady, error, signIn, retry: () => setAttempt((n) => n + 1) }),
    [user, isReady, error, signIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
