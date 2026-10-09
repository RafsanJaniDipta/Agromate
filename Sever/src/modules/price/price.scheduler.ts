import { logger } from "../../utils/logger.js";
import { syncCatalog } from "./price.service.js";
import { importTcbPrices } from "./tcb.import.js";

// Keeps prices fresh while the server runs: soon after start-up, then every hour.
// TCB publishes around midday; an hourly check picks the new day up without anyone's help.
// Importing is idempotent, so several servers sharing one database don't create duplicates.

const FIRST_RUN_DELAY_MS = 5_000;
const EVERY_MS = 60 * 60 * 1000;

let isRunning = false;

export async function refreshPrices() {
  if (isRunning) return null;
  isRunning = true;
  try {
    await syncCatalog();
    const result = await importTcbPrices();
    if (result.importedDays > 0) {
      logger.info(
        `[prices] imported ${result.importedDays} TCB day(s), latest ${result.latestDate?.toISOString().slice(0, 10)}`,
      );
    }
    return result;
  } finally {
    isRunning = false;
  }
}

export function startPriceUpdates() {
  const run = () =>
    refreshPrices().catch((error: unknown) => {
      // TCB being down only delays the update; the next hour tries again
      logger.error("[prices] update failed", error);
    });

  setTimeout(run, FIRST_RUN_DELAY_MS).unref();
  setInterval(run, EVERY_MS).unref();
}
