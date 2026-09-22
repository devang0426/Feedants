import type { Lang } from '../i18n';

const LOCALE: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN' };

/** ₹ 1,500 style formatting from integer paise. */
export function formatMoney(paise: number, currency = 'INR', lang: Lang = 'en'): string {
  const rupees = paise / 100;
  const hasFraction = rupees % 1 !== 0;
  try {
    const formatted = new Intl.NumberFormat(LOCALE[lang], {
      style: 'currency',
      currency,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    }).format(rupees);
    // Reference design renders a space after the rupee symbol: "₹ 1,500".
    return formatted.replace(/^(\D+)(\d)/, '$1 $2').replace(/\s+/g, ' ').trim();
  } catch {
    return `₹ ${Math.round(rupees).toLocaleString()}`;
  }
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const MONTHS_HI = ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];

/** "10 Aug 26" — matches the reference design. */
export function formatShortDate(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  const months = lang === 'hi' ? MONTHS_HI : MONTHS_EN;
  return `${d.getDate()} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
}

/** "11:50 PM" */
export function formatTime(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  try {
    return new Intl.DateTimeFormat(LOCALE[lang], { hour: 'numeric', minute: '2-digit', hour12: true })
      .format(d)
      .toUpperCase();
  } catch {
    const h = d.getHours();
    const suffix = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${suffix}`;
  }
}

export function formatDateTime(iso: string, lang: Lang = 'en'): string {
  return `${formatShortDate(iso, lang)}, ${formatTime(iso, lang)}`;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isOver: boolean;
}

export function getCountdownParts(targetIso: string, now: Date): CountdownParts {
  const totalMs = Math.max(new Date(targetIso).getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
    isOver: totalMs === 0,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "01d : 06h : 28m : 32s" */
export function formatCountdown(parts: CountdownParts): string {
  return `${pad(parts.days)}d : ${pad(parts.hours)}h : ${pad(parts.minutes)}m : ${pad(parts.seconds)}s`;
}
