import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/competitions';
import { setAuthToken } from '../api/client';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  /** True once the saved session (if any) has been checked. */
  isReady: boolean;
  signIn: (email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'feedants.token';

/**
 * Session management. Restores a saved JWT on launch and validates it with
 * /auth/me; otherwise the app shows the sign-in screen. The demo backend
 * issues tokens by e-mail (no password); swapping in OTP/OAuth only changes
 * `signIn`, the rest of the app keys off `user`.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();

  const signIn = useCallback(
    async (email: string, name?: string) => {
      const { token, user: nextUser } = await authApi.demoLogin({ email: email.trim(), name });
      setAuthToken(token);
      await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => undefined);
      setUser(nextUser);
      // Per-user data (viewer state, registrations) must not leak across sessions.
      await queryClient.invalidateQueries({ queryKey: ['competitions'] });
    },
    [queryClient]
  );

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
    setUser(null);
    queryClient.removeQueries({ queryKey: ['competitions', 'mine'] });
    await queryClient.invalidateQueries({ queryKey: ['competitions'] });
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
        if (!saved) return;
        setAuthToken(saved);
        try {
          const me = await authApi.me();
          if (!cancelled) setUser(me);
        } catch {
          // Expired/invalid token: fall back to the sign-in screen.
          setAuthToken(null);
          await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, isReady, signIn, signOut }), [user, isReady, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
