import { useEffect, useMemo, useState } from 'react';
import { getServerNow, subscribeClockOffset } from '../api/client';
import { getCountdownParts, type CountdownParts } from '../utils/format';

/**
 * A "now" that ticks every second and is corrected by the server clock
 * offset, so a wrong device clock cannot show a stale or negative countdown.
 */
export function useServerNow(tickMs = 1000): Date {
  const [now, setNow] = useState(() => getServerNow());

  useEffect(() => {
    const id = setInterval(() => setNow(getServerNow()), tickMs);
    const unsubscribe = subscribeClockOffset(() => setNow(getServerNow()));
    return () => {
      clearInterval(id);
      unsubscribe();
    };
  }, [tickMs]);

  return now;
}

export function useCountdown(targetIso: string | null | undefined): CountdownParts | null {
  const now = useServerNow();
  return useMemo(() => (targetIso ? getCountdownParts(targetIso, now) : null), [targetIso, now]);
}
