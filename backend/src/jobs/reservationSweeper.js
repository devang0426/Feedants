import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { releaseExpiredReservations } from '../services/registrationService.js';

/**
 * Periodically releases spots held by unpaid reservations. In a multi-instance
 * deployment this would run once (a cron/worker, or leader-elected), but the
 * status-guarded updates make it safe even if several instances run it.
 */
export function startReservationSweeper() {
  let running = false;
  const tick = async () => {
    if (running) return; // never overlap ticks
    running = true;
    try {
      await releaseExpiredReservations();
    } catch (err) {
      logger.error({ err }, 'Reservation sweep failed');
    } finally {
      running = false;
    }
  };
  const handle = setInterval(tick, env.reservationSweepIntervalMs);
  handle.unref?.();
  void tick();
  return () => clearInterval(handle);
}
