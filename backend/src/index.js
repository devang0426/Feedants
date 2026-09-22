import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { createApp } from './app.js';
import { startReservationSweeper } from './jobs/reservationSweeper.js';
import { seedDatabase } from './seed/seed.js';
import { Competition } from './models/index.js';

async function main() {
  const { isEphemeral } = await connectDatabase();

  // An ephemeral (in-memory) database is empty on every boot, so seed it so
  // the app has something to show. A persistent database is seeded only when
  // empty; use `npm run seed` or POST /api/v1/admin/seed to reset it.
  if (isEphemeral || (await Competition.estimatedDocumentCount()) === 0) {
    const summary = await seedDatabase({ reset: true });
    logger.info(summary, 'Database seeded');
  }

  const app = createApp();
  const stopSweeper = startReservationSweeper();
  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.info(`API listening on http://0.0.0.0:${env.port}/api/v1`);
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    stopSweeper();
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
