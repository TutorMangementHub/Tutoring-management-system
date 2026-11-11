# Backend plan: Session Recommendation System

> Working document for the center's session scheduling backend. Section 12
> records the decisions that were open in the first draft; the rest of the
> document already reflects them.

---

## 1. Actors

| Actor | Description | Main goals |
|---|---|---|
| **Admin** | Manages the center itself (usually 1–2 people) | Create and deactivate teacher accounts, set center-wide settings (opening hours, closed days) |
| **Teacher** | Main user | Manage groups and timetables, get recommendations, schedule and run sessions |
| **Student** | Self-registers | See upcoming sessions for their group, get notified of changes |
| **System (scheduler)** | Background jobs | Auto-close stale sessions, send notifications, flag timetable conflicts |

Admin could be merged into Teacher for a minimal version, but a separate role makes the permission model cleaner and is easy to justify in a report.

---

## 2. Core domain concepts

- **Grade level**: 7th, 8th, 9th, and so on, each tagged as `middle` or `high` stage.
- **Group**: a school class group (for example "7th grade, group 5"). The school-wide catalogue may have 14 groups per grade, but only some are **active** in the center.
- **Free slot**: a weekly recurring interval when a group is free (for example Monday 12:00–14:00).
- **Student count (per group)**: the number of students *in the center* for that group. The recommendation engine uses it as a weight. Registered accounts can't serve as the weight, because not every student will create one.
- **Session**: a concrete teaching event on a specific date and time, targeting one or more groups, with a lifecycle.
- **Recommendation**: a computed, ranked, non-persistent suggestion. It becomes a Session only when the teacher confirms.

---

## 3. Business rules

### 3.1 Center-wide configuration (editable by Admin, with sensible defaults)
- **Operating hours**: for example 08:00–20:00. No session or recommendation may fall outside them, which rules out midnight.
- **Stage-specific latest end time**: for example middle school ends by 18:00 and high school by 20:00.
- **Operating days**: for example Mon–Sat. The weekend is configurable.
- **Closed dates**: holidays and exam weeks. Nothing can be scheduled on them.
- **Time granularity**: 15 minutes. All times snap to it.
- **Session duration**: min 30, max 180 minutes, default 60.
- **Buffer after school**: 15 minutes, so a student isn't expected to be in a session the minute class ends.
- **Minimum lead time**: a session must start at least about 2 hours from now. The teacher is warned if it's under 24 hours.
- **Max students per session**: for example 30, matching room capacity.
- **Time zone**: one configured zone. Store local times and never mix zones.

### 3.2 Timetables
- A free slot must have `start < end`, sit inside operating hours, and be at least 15 minutes long.
- **Overlaps are merged, not rejected.** If a teacher enters 12:00–13:00 and 12:30–14:00, the system saves 12:00–14:00 and tells them. Rejecting would just frustrate non-technical users.
- Adjacent slots (12:00–13:00 and 13:00–14:00) are merged too.
- Teachers edit a **whole day for a group at once** ("replace Monday's free time"). That's easier than adding and removing individual slots.
- A group with no free slots is allowed, but it is flagged as **"cannot be recommended"**.
- **Impact check**: if a timetable change makes an already planned session invalid for some group, the change is saved but the session is flagged `hasConflict` and the teacher is warned. Nothing is cancelled automatically.

### 3.3 Group management
- Only **active** groups participate in recommendations.
- A group can be deactivated, not deleted, so history stays intact.
- Deactivating a group that has planned sessions needs explicit confirmation. The group is removed from those sessions, and if a session ends up with no groups it must be cancelled.
- Every active group needs a `studentCount ≥ 1`.

### 3.4 Recommendations
- Teachers choose **grade level(s)** or a **custom subset of active groups**, plus a target week, duration, and optional filters (days, time window).
- A group is covered by a slot only if it is free for the **entire duration** (after the buffer).
- Already scheduled (non-cancelled) sessions block those groups at that time, so no group is double-booked.
- The teacher's own existing sessions block those times (a teacher can't be in two places).
- Slots in the past, on closed dates, or outside operating hours are never returned.
- Ranking prefers more students covered, then fewer groups left out, then "reasonable hours" (for example 14:00–18:00), then earlier in the week.
- **Fairness guarantee**: the *coverage plan* (section 5) tries to give every selected group at least one session, and clearly reports groups that cannot be served and why.

### 3.5 Sessions
- A teacher cannot have two overlapping active sessions.
- Scheduling from a recommendation re-validates everything at confirm time, because data may have changed since the suggestion was shown.
- Manual scheduling at a time not in the recommendations is allowed only with **explicit override**. The response lists which groups aren't free.
- Only the owning teacher (or an Admin) can change a session.
- Cancel and postpone **require a reason**.

### 3.6 Students
- A student registers with email and password and **must choose a group** using a **join code** that the teacher gives for that group. This stops random people from joining.
- A student sees only sessions that target their group.
- Students can change group only through a teacher or Admin.
- Students are notified **in-app only**; they do not confirm attendance.

---

## 4. Use cases

**Admin**
- UC-A1: Create, deactivate, and reset passwords for teacher accounts
- UC-A2: Configure center settings (hours, days, closed dates)
- UC-A3: Manage the school-wide group catalogue (grades and groups, seeded once)

**Teacher: groups**
- UC-G1: Activate or deactivate groups for the center
- UC-G2: Set the student count per group
- UC-G3: View and regenerate a group's join code

**Teacher: timetables**
- UC-T1: Set free time for a group on a given day (replace the day)
- UC-T2: View a group's weekly timetable
- UC-T3: Copy one day's slots to other days or another group
- UC-T4: View the overall availability heatmap for a grade (how many students are free per hour)
- UC-T5 *(optional)*: Import a timetable from CSV

**Teacher: sessions**
- UC-S1: Request recommendations (grade or groups, week, duration)
- UC-S2: View a coverage plan ("these 3 sessions cover all your groups")
- UC-S3: Schedule a session from a recommendation
- UC-S4: Schedule a session manually, with override
- UC-S5: Edit a planned session (topic, notes, time)
- UC-S6: Start, finish, postpone, reschedule, or cancel a session
- UC-S7: View the session list and calendar, filterable by status, grade, and date
- UC-S8: Resolve flagged conflicts after a timetable change

**Student**
- UC-ST1: Register with a join code, log in, reset password
- UC-ST2: View upcoming sessions for their group
- UC-ST3: Read notifications (new, postponed, cancelled, or rescheduled)

**System**
- UC-SYS1: Auto-transition stale sessions
- UC-SYS2: Create **in-app** notifications
- UC-SYS3: Flag conflicts when timetables or groups change

---

## 5. The recommendation engine

Keep it **pure functions with no Express or DB imports**, so it is easy to unit test and easy to explain in a report.

**Input:** active groups with weights, their free slots, existing sessions (teacher and group conflicts), closed dates, config, and the request parameters.

**Step 1: Generate candidate windows.** For each operating day in the target week, step through start times at 15-minute granularity. Each window is `[s, s + duration]`.

**Step 2: Compute coverage per window.** For each window, find the groups whose free interval contains it (after the buffer) and who have no conflicting session. Represent the covered groups as a **bitmask**. The score is the sum of student counts (capped by room capacity), with the tie-breakers from section 3.4. A sweep-line approach, or just checking every group, is fast enough: with about 14–30 groups, 6 days, and 48 start times, this is trivial.

**Step 3: Ranked list.** Merge overlapping windows with the same coverage into one range ("Mon 14:00–16:00 works for any start within it"), so the teacher doesn't see 8 near-duplicate suggestions.

**Step 4: Coverage plan** (the "every group gets at least one session" requirement). This is a **set cover** problem.
- *Simple version:* greedy. Repeatedly pick the window covering the most not-yet-covered students, until every coverable group is covered.
- *Better version for the report:* because there are at most about 20–30 groups, an **exact** solution is feasible with bitmask DP or branch and bound. It gives the minimum number of sessions. Compare it against greedy in your report.
- Groups that no window can cover are returned in `uncoverable`, with a reason ("no free time of 60 minutes; the longest is 45 minutes, try a shorter session").

**Step 5: Explainability.** Every recommendation returns *who is free*, *who isn't and why*, and *the student count*. Teachers trust a system that shows its reasoning.

---

## 6. Session lifecycle

```
            ┌──────────► cancelled (terminal)
            │                ▲
 planned ───┼──► started ──► finished (terminal)
   ▲  │     │
   │  └──► postponed ───────┘ (can also be cancelled)
   └─────────── (reschedule to a new date/time)
```

| From | To | Rules |
|---|---|---|
| planned | started | Only from 15 min before the start until the end time |
| planned | postponed | Reason required. The teacher may supply a new slot, which is revalidated |
| planned | cancelled | Reason required, students notified |
| postponed | planned | A new date and time is required and fully revalidated |
| postponed | cancelled | Reason required |
| started | finished | Allowed any time after starting |
| anything else | - | Rejected with a plain-language message |

- **Automatic transitions (scheduler):** a `started` session past its end time plus a 30-minute grace period becomes `finished`. A `planned` session whose end time passed without being started becomes `cancelled`, with the system reason "Session was never started".
- Every transition is written to a **status history** table (who, when, reason).
- Use **optimistic locking** (a `version` column) so two teachers or two tabs can't apply conflicting transitions.

---

## 7. Architecture and stack

**Stack:** Node 24, Express 5, PostgreSQL, Zod (validation), JWT with refresh tokens (or secure cookie sessions), argon2 or bcrypt, pino (logging), helmet, express-rate-limit, node-cron, and Vitest or `node:test` with supertest for tests. For the ORM, Prisma or Drizzle both work.

**Layering:**
```
routes → middleware (auth, validate, rate-limit) → controllers
       → services (business rules, transactions) → repositories (DB)
engine/  (pure recommendation logic, no dependencies)
jobs/    (scheduler)
```

**Layering is MVC by technical layer, not by feature module.** Each feature
(`auth`, `users`, `grades`, `groups`, `timetables`, `recommendations`,
`sessions`, `notifications`, `settings`) contributes one file to each layer:

```
src/
├── routes/         paths + guards, bound to controller actions
├── controllers/    "C": parse input, call the service, send JSON
├── services/       business rules, transactions
├── repositories/   data access (Drizzle), plain objects
├── schemas/        Zod request schemas
├── models/         "M": tables, enums, checks, indexes
├── common/         errors, middleware, utils, shared types
├── engine/         pure recommendation logic
├── jobs/           scheduler
└── db/             connection pool, seed
```

Dependencies point one way only: `routes → controllers → services →
repositories → models`. The JSON response written by the controller is the
view; there are no server-rendered templates. Adding a feature adds one file
per layer and one mount in `routes/index.ts`.

---

## 8. Data model (main tables)

- `users` (id, role, name, email, password_hash, is_active)
- `grade_levels` (id, name, stage)
- `groups` (id, grade_level_id, number, is_active, student_count, join_code)
- `student_profiles` (user_id, group_id)
- `free_slots` (id, group_id, day_of_week, start_min, end_min)
  - Times are stored as minutes from midnight, which makes comparisons simple.
- `sessions` (id, teacher_id, title, type, date, start_min, end_min, status, version, has_conflict, notes)
  - `type` is one of exam_prep, explanation, homework_help.
- `session_groups` (session_id, group_id)
- `session_status_history` (session_id, from, to, reason, changed_by, at)
- `closed_dates`, `settings`, `notifications`

Add DB-level constraints as a second line of defense (CHECK `start < end`, unique `(group_id, day, start)`, and in Postgres optionally an exclusion constraint against overlapping slots). Always index `(group_id, day_of_week)` and `(date, status)`.

---

## 9. API overview

```
POST   /auth/login | /auth/refresh | /auth/register-student
GET/PATCH /settings                      (admin)
GET/POST/PATCH /users                    (admin: teachers)

GET    /grades
GET    /groups?active=true
PATCH  /groups/:id                       (activate, student count)
POST   /groups/:id/join-code/regenerate

GET    /groups/:id/timetable
PUT    /groups/:id/timetable/:day        (replace the day)
POST   /groups/:id/timetable/copy
GET    /grades/:id/availability          (heatmap)

POST   /recommendations                  (search: returns ranked + coverage plan)
POST   /sessions                         (from a recommendation or manual)
GET    /sessions?status=&grade=&from=&to=
PATCH  /sessions/:id
POST   /sessions/:id/{start|finish|postpone|reschedule|cancel}

GET    /me/sessions                      (student)
GET    /me/notifications
```

A recommendation request is a POST (not GET) because of its complex body, but it is read-only and persists nothing.

---

## 10. Error handling and edge cases

**Error format** (one shape everywhere):
```json
{
  "error": {
    "code": "SESSION_TEACHER_CONFLICT",
    "message": "You already have a session on Monday from 14:00 to 15:00.",
    "hint": "Choose a different time or cancel the other session.",
    "details": [{ "field": "startTime" }]
  }
}
```
- Messages are in **plain language, no jargon, and never expose stack traces**. Keep messages in one catalogue so they can be translated (Arabic or French may matter for your users).
- Stable error codes let a future frontend react to specific cases.
- Distinguish **errors** (blocked), **warnings** (allowed with `confirm: true`), and **info** (for example "we merged two overlapping slots").

**Forgiving input:** accept `8:30`, `08:30`, and `8h30`. Trim and normalize everything. Snap times to the 15-minute grid, with a note if it was adjusted.

**Destructive actions** (deactivating a group, cancelling, replacing a timetable) return a **preview of what will be affected**, and require confirmation.

**Edge cases to handle explicitly:**
- No active groups selected, or a grade with no active groups
- Group with no timetable, or with no free time long enough
- Duration longer than any common free interval, so the engine suggests shorter durations
- Request for a past week, or a week full of closed days
- Two teachers scheduling the same group at the same time (race condition). Use a **transaction plus a re-check at commit**, and return a clear conflict error.
- Recommendation becomes stale between "view" and "confirm"
- Session crossing the end-of-day limit, and anything near midnight
- Student registers with a wrong or expired join code, or with a group that has since been deactivated
- Teacher deactivated while owning planned sessions (reassign or flag them)
- Duplicate submissions (double clicks). Make creates idempotent with an idempotency key or a unique constraint.
- Daylight saving, if your zone observes it. A single configured zone plus tests covers this.

**Security basics:** role-based access on every route, ownership checks, rate limiting on login and registration, password rules, and a generic "invalid email or password" response so accounts can't be enumerated.

---

## 11. Testing and milestones

**Testing priorities:**
1. **Engine unit tests** (highest value): empty timetables, a single group, perfectly aligned groups, no overlap at all, boundary times, set cover on known cases.
2. State machine tests (every allowed and forbidden transition).
3. API integration tests for each use case, including error paths.
4. A seeded demo dataset (for example 14 groups in 7th grade with realistic timetables) for your demo and report.

**Milestones:**
1. Setup, auth, roles, settings, error framework
2. Grades, groups, and group management
3. Timetable module (merge logic, copy, heatmap)
4. **Recommendation engine** (greedy first, then exact)
5. Sessions, lifecycle, and history
6. Student accounts, notifications, scheduler jobs
7. Hardening, test coverage, API docs (OpenAPI), demo data

---

## 12. Resolved decisions

The four open questions are now closed. These choices are binding for the
implementation.

| # | Question | Decision | Impact on the design |
|---|---|---|---|
| 1 | Who owns groups? | **One shared set of active groups for the whole center.** | `groups` has no `teacher_id`. Any teacher may manage any group's timetable and activate/deactivate groups. Admin oversight stays as described. |
| 2 | Do teachers have their own availability? | **No.** Only conflicts with the teacher's existing sessions are considered. | No `teacher_free_slots` table, no teacher timetable UI, and the engine's teacher input is just a list of busy blocks. |
| 3 | Should students confirm attendance? | **No.** | No attendance table, no attendance endpoints, and no "attended/absent" states in the session lifecycle. The session list is the source of truth. |
| 4 | Are notifications emailed? | **In-app only.** | No SMTP/email provider dependency. `notifications` is the delivery channel; UC-SYS2 creates rows, and students poll `GET /me/notifications`. |

### Consequences worth stating in the report

- **Shared groups** simplify the model but mean timetable edits are a shared
  resource: two teachers can edit the same group's week. Every write is
  validated and the response reports merged slots and conflicts. Optimistic
  locking is used for sessions; timetable day replacement is last-write-wins
  by design (the whole day is replaced atomically).
- **No teacher availability** makes the teacher constraint cheap: one indexed
  query for that teacher's non-cancelled sessions in the target week.
- **No attendance** keeps the lifecycle at five statuses and makes the
  scheduler the only automated writer.
- **In-app notifications** remove deliverability concerns (spam, bounces) and
  keep the demo self-contained.

### Remaining assumptions (change only if needed)

- **Time zone default** is `Africa/Algiers`; it is a setting, not a constant.
- **TypeScript** is used throughout, with **Drizzle** as the ORM. Both were
  open choices in section 7; TypeScript makes the Zod schemas and the pure
  engine types share one source of truth, and Drizzle keeps the SQL visible
  for the constraints required in section 8.
- **Refresh tokens** are JWTs stored hashed in `refresh_tokens` and rotated on
  every refresh; the refresh token travels in an httpOnly cookie.
- **Warnings vs errors**: warnings are returned in a `warnings` array with a
  `confirm: true` requirement on the mutating call; info notices (for example
  "slots merged") use the same array with `severity: "info"`.
