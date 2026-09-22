import { DEFAULT_LANG, isSupportedLang } from '../utils/i18n.js';

/**
 * Resolves the response language from `?lang=` (explicit toggle in the app)
 * or the `Accept-Language` header, defaulting to English.
 */
export function resolveLang(req, _res, next) {
  const query = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase() : null;
  if (query && isSupportedLang(query)) {
    req.lang = query;
    return next();
  }
  const header = (req.headers['accept-language'] || '').split(',')[0]?.trim().slice(0, 2);
  req.lang = isSupportedLang(header) ? header : DEFAULT_LANG;
  return next();
}
