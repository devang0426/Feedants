/** Design tokens sampled from the Feedants reference screen. */
export const colors = {
  primary: '#0E7C86',
  primaryDark: '#0B5F66',
  primarySoft: '#E6F4F5',
  primarySofter: '#F1F9F9',
  accentGreen: '#EAF7EE',
  accentGreenBorder: '#CDEBD6',
  background: '#F5F7F8',
  surface: '#FFFFFF',
  border: '#E5EAEC',
  borderStrong: '#D3DBDE',
  text: '#0F1F24',
  textSecondary: '#5B6B71',
  textMuted: '#8A979C',
  success: '#0E7C86',
  danger: '#D14343',
  dangerSoft: '#FDECEC',
  warning: '#B7791F',
  warningSoft: '#FFF6E5',
  chip: '#F1F4F5',
  gold: '#F2B01E',
  silver: '#9AA5AB',
  bronze: '#D9822B',
  overlay: 'rgba(15, 31, 36, 0.45)',
  disabled: '#B9C6CA',
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
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

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
  h1: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  bodySecondary: { fontSize: 14, color: colors.textSecondary },
  caption: { fontSize: 12, color: colors.textSecondary },
  captionMuted: { fontSize: 12, color: colors.textMuted },
  money: { fontSize: 26, fontWeight: '700' as const, color: colors.primary },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F1F24',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;
