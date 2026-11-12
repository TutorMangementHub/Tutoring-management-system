import { isoDateOfWeek, zonedWallTimeToUtc } from "../common/utils/time.js";
import type { CandidateWindow, EngineConfig } from "./types.js";

export interface GenerateWindowsInput {
  weekStart: string;
  /** ISO weekdays to consider. Defaults to the center's operating days. */
  days?: number[];
  durationMin: number;
  config: EngineConfig;
  /** Current instant. Injected for determinism. */
  now: Date;
  /** Optional restriction on start times. */
  window?: { startMin: number; endMin: number };
}

/**
 * Step 1 of the engine: every possible start time in the target week.
 *
 * A window is kept only when it:
 * - falls on an operating day that is not closed,
 * - starts and ends inside operating hours,
 * - starts inside the optional time window,
 * - respects the minimum lead time from `now`.
 *
 * Group-specific constraints (free slots, stage end time, conflicts) are
 * applied later, in the coverage step.
 */
export function generateCandidateWindows(input: GenerateWindowsInput): CandidateWindow[] {
  const { weekStart, durationMin, config, now, days, window } = input;

  if (durationMin <= 0) throw new RangeError("durationMin must be positive");
  if (config.gridMinutes <= 0) throw new RangeError("gridMinutes must be positive");

  const wantedDays = days?.length ? days : config.operatingDays;
  const closed = new Set(config.closedDates);
  const notBefore = now.getTime() + config.minLeadMinutes * 60_000;

  const result: CandidateWindow[] = [];

  for (const dayOfWeek of [...wantedDays].sort((a, b) => a - b)) {
    if (!config.operatingDays.includes(dayOfWeek)) continue;

    const date = isoDateOfWeek(weekStart, dayOfWeek);
    if (closed.has(date)) continue;

    const earliestStart = Math.max(
      config.openMin,
      window?.startMin ?? config.openMin,
    );
    const latestStart = Math.min(
      config.closeMin - durationMin,
      window ? window.endMin - durationMin : config.closeMin - durationMin,
    );

    for (
      let startMin = earliestStart;
      startMin <= latestStart;
      startMin += config.gridMinutes
    ) {
      const endMin = startMin + durationMin;

      // Lead time is checked on the real instant, not on wall-clock minutes.
      const startInstant = zonedWallTimeToUtc(date, startMin, config.timeZone);
      if (startInstant.getTime() < notBefore) continue;

      result.push({ date, dayOfWeek, startMin, endMin });
    }
  }

  return result;
}
