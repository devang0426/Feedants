export const SUPPORTED_LANGS = ['en', 'hi'];
export const DEFAULT_LANG = 'en';

export const isSupportedLang = (lang) => SUPPORTED_LANGS.includes(lang);

/**
 * Resolves a localized field `{ en, hi }` to a plain string for `lang`,
 * falling back to English. Non-object values are returned untouched.
 */
export const t = (field, lang = DEFAULT_LANG) => {
  if (field == null) return field;
  if (typeof field !== 'object' || Array.isArray(field)) return field;
  return field[lang] ?? field[DEFAULT_LANG] ?? Object.values(field)[0] ?? '';
};

/** Schema helper for a localized string field. */
export const localizedString = ({ required = false } = {}) => ({
  en: { type: String, required, trim: true },
  hi: { type: String, trim: true },
});
