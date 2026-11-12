/**
 * Automatic session transitions (UC-SYS1).
 *
 * Rules from the plan:
 * - `started` and past `end + 30 min` grace  -> `finished`
 * - `planned` and past `end` without starting -> `cancelled`, reason
 *   "Session was never started"
 *
 * Both functions must:
 * - be idempotent (safe to run twice),
 * - write a status-history row with `changed_by = null`,
 * - notify affected students,
 * - use the configured time zone when deciding whether a session is past.
 *
 * TODO: implement with Drizzle in milestone 6.
 */

export async function autoFinishStaleSessions(): Promise<number> {
  return 0;
}

export async function autoCancelNeverStarted(): Promise<number> {
  return 0;
}
