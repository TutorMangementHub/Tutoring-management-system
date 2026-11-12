/**
 * Default values for the center-wide settings.
 *
 * These are the values seeded on first run; after that the `settings` table is
 * the source of truth and an Admin can change them through the API.
 * Times are minutes from midnight (local center time).
 */
export const DEFAULTS = {
  /** All times snap to this grid. */
  gridMinutes: 15,
  /** 08:00 */
  openMin: 480,
  /** 20:00 */
  closeMin: 1200,
  /** Middle-school sessions must end by 18:00. */
  middleLatestEndMin: 1080,
  /** High-school sessions must end by 20:00. */
  highLatestEndMin: 1200,
  /** Rest after the school day before a student can be in a session. */
  bufferMinutes: 15,
  /** Operating days, ISO weekday numbers (1 = Monday .. 7 = Sunday). */
  operatingDays: [1, 2, 3, 4, 5, 6] as const,
  minDurationMinutes: 30,
  maxDurationMinutes: 180,
  defaultDurationMinutes: 60,
  /** A session may not start less than this many minutes from "now". */
  minLeadMinutes: 120,
  /** Below this lead time the teacher gets a warning (not a block). */
  warnLeadMinutes: 24 * 60,
  /** Room capacity. */
  maxStudentsPerSession: 30,
  /** Ranking prefers start times in this window. */
  preferredStartMin: 14 * 60,
  preferredEndMin: 18 * 60,
} as const;

export const ROLES = ["admin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];

export const STAGES = ["middle", "high"] as const;
export type Stage = (typeof STAGES)[number];

export const SESSION_TYPES = ["exam_prep", "explanation", "homework_help"] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_STATUSES = [
  "planned",
  "started",
  "postponed",
  "finished",
  "cancelled",
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
