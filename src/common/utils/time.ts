/**
 * Pure time helpers shared by the API and the recommendation engine.
 *
 * Conventions used across the project:
 * - A calendar date is an ISO string `YYYY-MM-DD` in the center's time zone.
 * - A time of day is an integer number of minutes from local midnight.
 * - Date arithmetic uses UTC internally so the host machine's time zone can
 *   never change the result. Conversion to a real instant happens only in
 *   `zonedWallTimeToUtc`, which takes the configured zone explicitly.
 */

export const MINUTES_PER_DAY = 24 * 60;
export const GRID_MINUTES = 15;

export interface Interval {
  startMin: number;
  endMin: number;
}

/* -------------------------------------------------------------------------- */
/* Times of day                                                               */
/* -------------------------------------------------------------------------- */

const TIME_PATTERN = /^(\d{1,2})\s*(?:[:h.]\s*(\d{1,2})?)?$/i;

/**
 * Accepts forgiving user input: `8:30`, `08:30`, `8h30`, `8H30`, `8h`, `8`.
 * Returns minutes from midnight, or `null` when the input is not a valid time.
 */
export function parseTimeToMinutes(input: string | number): number | null {
  if (typeof input === "number") {
    return Number.isInteger(input) && input >= 0 && input < MINUTES_PER_DAY ? input : null;
  }

  const match = TIME_PATTERN.exec(input.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);

  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** `510` -> `"08:30"`. */
export function formatMinutes(minutes: number): string {
  const normalized = Math.max(0, Math.min(MINUTES_PER_DAY, Math.trunc(minutes)));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export interface SnapResult {
  value: number;
  /** True when the input was not already on the grid. */
  adjusted: boolean;
}

/**
 * Rounds to the nearest multiple of `grid` (default 15 minutes).
 * The caller should tell the user when `adjusted` is true.
 */
export function snapToGrid(minutes: number, grid: number = GRID_MINUTES): SnapResult {
  if (grid <= 0 || !Number.isInteger(grid)) {
    throw new RangeError("grid must be a positive integer");
  }
  const snapped = Math.round(minutes / grid) * grid;
  return { value: snapped, adjusted: snapped !== minutes };
}

/* -------------------------------------------------------------------------- */
/* Intervals                                                                  */
/* -------------------------------------------------------------------------- */

export function isValidInterval(interval: Interval): boolean {
  return (
    Number.isInteger(interval.startMin) &&
    Number.isInteger(interval.endMin) &&
    interval.startMin >= 0 &&
    interval.endMin <= MINUTES_PER_DAY &&
    interval.startMin < interval.endMin
  );
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/** True when `inner` lies completely inside `outer` (touching edges allowed). */
export function intervalContains(outer: Interval, inner: Interval): boolean {
  return outer.startMin <= inner.startMin && inner.endMin <= outer.endMin;
}

export function intervalsEqual(a: Interval, b: Interval): boolean {
  return a.startMin === b.startMin && a.endMin === b.endMin;
}

export interface MergeResult {
  intervals: Interval[];
  /** True when overlapping or adjacent intervals were combined. */
  merged: boolean;
}

/**
 * Sorts and merges overlapping or adjacent intervals.
 * Adjacent means `a.endMin === b.startMin` (12:00-13:00 + 13:00-14:00).
 */
export function mergeIntervals(intervals: readonly Interval[]): MergeResult {
  if (intervals.length === 0) return { intervals: [], merged: false };

  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const result: Interval[] = [];
  for (const current of sorted) {
    const last = result[result.length - 1];
    if (last && current.startMin <= last.endMin) {
      if (current.endMin > last.endMin) last.endMin = current.endMin;
      continue;
    }
    result.push({ ...current });
  }

  const merged =
    result.length !== intervals.length ||
    result.some((interval, index) => {
      const original = [...intervals].sort(
        (a, b) => a.startMin - b.startMin || a.endMin - b.endMin,
      )[index];
      return !original || !intervalsEqual(interval, original);
    });

  return { intervals: result, merged };
}

/* -------------------------------------------------------------------------- */
/* Calendar dates (ISO `YYYY-MM-DD`)                                          */
/* -------------------------------------------------------------------------- */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isoDateToUtcMs(value: string): number {
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day);
}

function utcMsToIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Adds calendar days to an ISO date, safely across month/year boundaries. */
export function addDays(value: string, days: number): string {
  if (!isValidIsoDate(value)) throw new RangeError(`Invalid ISO date: ${value}`);
  return utcMsToIsoDate(isoDateToUtcMs(value) + days * 86_400_000);
}

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(value: string): number {
  if (!isValidIsoDate(value)) throw new RangeError(`Invalid ISO date: ${value}`);
  const day = new Date(isoDateToUtcMs(value)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** The date of `weekday` inside the week starting on `weekStartIso` (a Monday). */
export function isoDateOfWeek(weekStartIso: string, weekday: number): string {
  if (weekday < 1 || weekday > 7) throw new RangeError("weekday must be 1..7");
  return addDays(weekStartIso, weekday - 1);
}

/* -------------------------------------------------------------------------- */
/* Time zone                                                                  */
/* -------------------------------------------------------------------------- */

/** Offset of `timeZone` at the given instant, in milliseconds (east positive). */
function timeZoneOffsetMs(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return asUtc - instant.getTime();
}

/**
 * Converts a local wall-clock date + time of day into a real `Date`.
 *
 * Two passes handle daylight-saving transitions. A time that does not exist
 * (spring forward) resolves to the instant after the gap; a repeated time
 * (fall back) resolves to the first occurrence.
 */
export function zonedWallTimeToUtc(
  dateIso: string,
  minutes: number,
  timeZone: string,
): Date {
  if (!isValidIsoDate(dateIso)) throw new RangeError(`Invalid ISO date: ${dateIso}`);

  const [year, month, day] = dateIso.split("-").map(Number) as [number, number, number];
  const wallMs = Date.UTC(year, month - 1, day, 0, 0, 0) + minutes * 60_000;

  let instant = wallMs - timeZoneOffsetMs(new Date(wallMs), timeZone);
  instant = wallMs - timeZoneOffsetMs(new Date(instant), timeZone);

  return new Date(instant);
}

/** Today's date in the given zone, as `YYYY-MM-DD`. */
export function todayInZone(timeZone: string, now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}
