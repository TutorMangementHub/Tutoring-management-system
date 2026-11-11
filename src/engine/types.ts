import type { SessionType, Stage } from "../config/constants.js";

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */

/** Center configuration, already resolved from the `settings` table. */
export interface EngineConfig {
  timeZone: string;
  /** Opening time, minutes from midnight. */
  openMin: number;
  /** Closing time, minutes from midnight. */
  closeMin: number;
  /** Stage-specific latest end time. */
  latestEndMinByStage: Record<Stage, number>;
  /** ISO weekdays the center is open (1 = Monday .. 7 = Sunday). */
  operatingDays: number[];
  /** ISO dates with no sessions at all. */
  closedDates: string[];
  /** All times must be a multiple of this. */
  gridMinutes: number;
  /** Rest after the school day before a student can attend. */
  bufferMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  maxStudentsPerSession: number;
  /** Start times inside this window rank higher. */
  preferredStartMin: number;
  preferredEndMin: number;
  /** A session may not start sooner than this from "now". */
  minLeadMinutes: number;
}

export interface FreeSlot {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

export interface EngineGroup {
  id: string;
  stage: Stage;
  /** Number of students in the center for this group; the ranking weight. */
  studentCount: number;
  isActive: boolean;
  freeSlots: FreeSlot[];
}

/** An existing non-cancelled session that occupies a group. */
export interface GroupBusyBlock {
  groupId: string;
  date: string;
  startMin: number;
  endMin: number;
}

/** An existing non-cancelled session that occupies the teacher. */
export interface TeacherBusyBlock {
  date: string;
  startMin: number;
  endMin: number;
}

export interface RecommendationRequest {
  /** Monday of the target week, `YYYY-MM-DD`. */
  weekStart: string;
  durationMin: number;
  /** Optional: only these grade levels. */
  gradeLevelIds?: string[];
  /** Optional: an explicit subset of active groups. */
  groupIds?: string[];
  /** Optional: restrict to these ISO weekdays. */
  days?: number[];
  /** Optional: restrict start times to this window. */
  window?: { startMin: number; endMin: number };
  /** Current instant, ISO 8601. Injected so the engine stays pure. */
  now: string;
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                    */
/* -------------------------------------------------------------------------- */

export interface CandidateWindow {
  date: string;
  /** ISO weekday, 1..7. */
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

export interface WindowCoverage extends CandidateWindow {
  /** Active groups free for the whole window, after the buffer. */
  coveredGroupIds: string[];
  /** Sum of student counts of covered groups, capped by room capacity. */
  coveredStudentCount: number;
  /** Groups that are free but would push the session over capacity. */
  excludedByCapacity: string[];
}

export interface RankedWindow extends WindowCoverage {
  /** Higher is better. */
  score: number;
}

export interface UncoverableGroup {
  groupId: string;
  /** Plain-language explanation shown to the teacher. */
  reason: string;
}

export interface CoveragePlan {
  /** Minimal set of windows that covers every coverable group. */
  sessions: RankedWindow[];
  /** Groups no window can serve, with a reason. */
  uncoverable: UncoverableGroup[];
}

export interface RecommendationResult {
  /** Ranked windows after merging equivalent adjacent ranges. */
  windows: RankedWindow[];
  /** Fairness plan: at least one session per coverable group. */
  plan: CoveragePlan;
  /** Echo of the request, useful for debugging and for the UI header. */
  request: RecommendationRequest & { durationMin: number };
}

/* -------------------------------------------------------------------------- */
/* Helper types                                                               */
/* -------------------------------------------------------------------------- */

export interface SessionDraft {
  date: string;
  startMin: number;
  endMin: number;
  groupIds: string[];
  type: SessionType;
  title?: string;
}
