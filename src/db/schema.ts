import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const roleEnum = pgEnum("role", ["admin", "teacher", "student"]);
export const stageEnum = pgEnum("stage", ["middle", "high"]);
export const sessionTypeEnum = pgEnum("session_type", [
  "exam_prep",
  "explanation",
  "homework_help",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "planned",
  "started",
  "postponed",
  "finished",
  "cancelled",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "session_created",
  "session_postponed",
  "session_rescheduled",
  "session_cancelled",
  "session_updated",
]);

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: roleEnum("role").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(sql`lower(${table.email})`)],
);

/** Refresh tokens are stored hashed so a database leak cannot mint sessions. */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("refresh_tokens_hash_unique").on(table.tokenHash),
    index("refresh_tokens_user_idx").on(table.userId),
  ],
);

/* -------------------------------------------------------------------------- */
/* School catalogue and groups                                                */
/* -------------------------------------------------------------------------- */

export const gradeLevels = pgTable("grade_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** "7th", "8th", ... */
  name: text("name").notNull(),
  stage: stageEnum("stage").notNull(),
});

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gradeLevelId: uuid("grade_level_id")
      .notNull()
      .references(() => gradeLevels.id),
    /** Group number inside the grade: 1..14. */
    number: smallint("number").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    /** Students in the center for this group; used as the ranking weight. */
    studentCount: integer("student_count").notNull().default(0),
    joinCode: text("join_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("groups_grade_number_unique").on(table.gradeLevelId, table.number),
    uniqueIndex("groups_join_code_unique").on(table.joinCode),
    check("groups_student_count_positive", sql`${table.studentCount} >= 0`),
    check("groups_number_positive", sql`${table.number} > 0`),
  ],
);

export const studentProfiles = pgTable(
  "student_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
  },
  (table) => [index("student_profiles_group_idx").on(table.groupId)],
);

/* -------------------------------------------------------------------------- */
/* Timetables                                                                 */
/* -------------------------------------------------------------------------- */

export const freeSlots = pgTable(
  "free_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    /** ISO weekday, 1 = Monday .. 7 = Sunday. */
    dayOfWeek: smallint("day_of_week").notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
  },
  (table) => [
    index("free_slots_group_day_idx").on(table.groupId, table.dayOfWeek),
    uniqueIndex("free_slots_group_day_start_unique").on(
      table.groupId,
      table.dayOfWeek,
      table.startMin,
    ),
    check("free_slots_day_valid", sql`${table.dayOfWeek} between 1 and 7`),
    check(
      "free_slots_range_valid",
      sql`${table.startMin} >= 0 and ${table.endMin} <= 1440 and ${table.startMin} < ${table.endMin}`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    type: sessionTypeEnum("type").notNull(),
    /** Calendar date in the center's time zone. */
    date: date("date", { mode: "string" }).notNull(),
    startMin: integer("start_min").notNull(),
    endMin: integer("end_min").notNull(),
    status: sessionStatusEnum("status").notNull().default("planned"),
    /** Optimistic locking. */
    version: integer("version").notNull().default(0),
    hasConflict: boolean("has_conflict").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("sessions_date_status_idx").on(table.date, table.status),
    index("sessions_teacher_date_idx").on(table.teacherId, table.date),
    check(
      "sessions_range_valid",
      sql`${table.startMin} >= 0 and ${table.endMin} <= 1440 and ${table.startMin} < ${table.endMin}`,
    ),
    check("sessions_version_non_negative", sql`${table.version} >= 0`),
  ],
);

export const sessionGroups = pgTable(
  "session_groups",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.groupId] }),
    index("session_groups_group_idx").on(table.groupId),
  ],
);

export const sessionStatusHistory = pgTable(
  "session_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    fromStatus: sessionStatusEnum("from_status"),
    toStatus: sessionStatusEnum("to_status").notNull(),
    reason: text("reason"),
    /** Null when the transition was made by the scheduler. */
    changedBy: uuid("changed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("session_status_history_session_idx").on(table.sessionId)],
);

/* -------------------------------------------------------------------------- */
/* Configuration and notifications                                            */
/* -------------------------------------------------------------------------- */

export const closedDates = pgTable("closed_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "string" }).notNull().unique(),
  reason: text("reason"),
});

/**
 * Singleton settings row (`id = 1`). Times are minutes from midnight in the
 * configured time zone. The API exposes this through `/settings`.
 */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    timeZone: text("time_zone").notNull(),
    openMin: integer("open_min").notNull(),
    closeMin: integer("close_min").notNull(),
    middleLatestEndMin: integer("middle_latest_end_min").notNull(),
    highLatestEndMin: integer("high_latest_end_min").notNull(),
    /** ISO weekdays, e.g. `[1,2,3,4,5,6]`. */
    operatingDays: jsonb("operating_days").$type<number[]>().notNull(),
    bufferMinutes: integer("buffer_minutes").notNull(),
    gridMinutes: integer("grid_minutes").notNull(),
    minDurationMinutes: integer("min_duration_minutes").notNull(),
    maxDurationMinutes: integer("max_duration_minutes").notNull(),
    defaultDurationMinutes: integer("default_duration_minutes").notNull(),
    minLeadMinutes: integer("min_lead_minutes").notNull(),
    warnLeadMinutes: integer("warn_lead_minutes").notNull(),
    maxStudentsPerSession: integer("max_students_per_session").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("settings_singleton", sql`${table.id} = 1`),
    check(
      "settings_hours_valid",
      sql`${table.openMin} >= 0 and ${table.openMin} < ${table.closeMin} and ${table.closeMin} <= 1440`,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
    index("notifications_created_idx").on(table.createdAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type FreeSlot = typeof freeSlots.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SettingsRow = typeof settings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
