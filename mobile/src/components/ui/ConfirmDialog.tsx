import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

/**
 * Promise-based confirmation dialog rendered with a Modal, so it behaves
 * identically on iOS, Android and web (React Native's Alert is a no-op on
 * web, which made "Cancel registration" and "Sign out" appear broken there).
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(options)} transparent animationType="fade" onRequestClose={() => settle(false)}>
        <Pressable style={styles.backdrop} onPress={() => settle(false)} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={styles.center} pointerEvents="box-none">
          {options ? (
            <View style={styles.card} accessibilityViewIsModal>
              <Text style={typography.h2}>{options.title}</Text>
              {options.message ? <Text style={[typography.bodySecondary, styles.message]}>{options.message}</Text> : null}
              <View style={styles.actions}>
                <Button label={options.cancelLabel} variant="outline" onPress={() => settle(false)} style={styles.action} />
                <Button
                  label={options.confirmLabel}
                  variant={options.destructive ? 'danger' : 'primary'}
                  onPress={() => settle(true)}
                  style={styles.action}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx.confirm;
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.xl,
  },
  message: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  action: { flex: 1 },
});
