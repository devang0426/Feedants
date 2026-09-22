import { StyleSheet } from 'react-native';

/**
 * Soft & minimal design system.
 * Brand teal is kept; everything else is quieter: near-white surfaces,
 * hairline borders instead of shadows, calmer type weights, more air.
 */
export const colors = {
  primary: '#0F7B84',
  primaryDark: '#0B5E65',
  primarySoft: '#EAF4F5',
  primarySofter: '#F5F9FA',
  accentGreen: '#EAF4F5',
  accentGreenBorder: '#D5E7E9',
  background: '#FBFCFC',
  surface: '#FFFFFF',
  border: '#ECEFF1',
  borderStrong: '#DCE3E6',
  text: '#16262B',
  textSecondary: '#5F6E73',
  textMuted: '#93A0A5',
  success: '#0F7B84',
  danger: '#C9463D',
  dangerSoft: '#FBEDEC',
  warning: '#A8721B',
  warningSoft: '#FBF4E6',
  chip: '#F3F5F6',
  gold: '#E0A82A',
  silver: '#A5B0B5',
  bronze: '#C88144',
  overlay: 'rgba(22, 38, 43, 0.35)',
  disabled: '#C5CFD3',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const hairline = StyleSheet.hairlineWidth;

/**
 * Font faces loaded in App.tsx. If loading fails the names fall back to the
 * system font, so the app never blocks on typography.
 */
export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  italic: 'Poppins_400Regular_Italic',
} as const;

export const typography = {
  h1: { fontSize: 20, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.2 },
  h2: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  h3: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text, lineHeight: 21 },
  bodySecondary: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  caption: { fontSize: 12, color: colors.textSecondary },
  captionMuted: { fontSize: 12, color: colors.textMuted },
  /** Small uppercase section label. */
  eyebrow: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  money: { fontSize: 22, fontWeight: '600' as const, color: colors.primary, letterSpacing: -0.3 },
} as const;

/** Elevation is not part of this system; kept as a no-op for callers. */
export const shadow = {
  card: {},
} as const;
