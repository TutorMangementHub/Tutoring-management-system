# Task list

Work is ordered by milestone. Each milestone ends with a shippable slice and a
short definition of done (DoD). Task IDs are stable, so commits and the report
can reference them (`feat(auth): M1-02 login`).

Legend: `[x]` done in the scaffold · `[ ]` to do · **(UC-…)** traceability.

---

## Milestone 0 — Foundation

- [x] **M0-01** Initialise git repository, `.gitignore`, `.editorconfig`, `.nvmrc` (Node 24).
- [x] **M0-02** TypeScript + ESM toolchain: `tsconfig.json`, `tsconfig.test.json`, `tsx` dev runner, build to `dist/`.
- [x] **M0-03** Express 5 app with helmet, JSON body limit, cookie parser, request-id, pino logging, global rate limit.
- [x] **M0-04** Single error shape (`AppError`, `ErrorCode`, error middleware, 404 handler, Zod → 422).
- [x] **M0-05** Environment validation with Zod and a documented `.env.example`.
- [x] **M0-06** MVC layer skeleton (`routes/controller/service/schema/repository` files per feature, one folder per layer).
- [x] **M0-07** Drizzle schema for all tables + initial SQL migration (`drizzle/0000_init.sql`).
- [x] **M0-08** Pure time utilities (forgiving time parsing, snapping, merging, ISO dates, zone conversion) with tests.
- [x] **M0-09** Engine step 1: `generateCandidateWindows` with tests.
- [x] **M0-10** `/health` and `/health/ready`, Vitest + supertest harness (40 tests passing).

**DoD:** `npm run typecheck`, `npm test` and `npm run build` pass; the app
starts and serves `/health`; scaffolded endpoints return `501 NOT_IMPLEMENTED`
behind the correct guards.

---

## Milestone 1 — Auth, roles, settings, error framework

- [ ] **M1-01** Password hashing service (argon2id, tuned memory/time cost) + password policy (min 8, not the email, common-password check optional).
- [ ] **M1-02** `POST /auth/login` — generic `INVALID_CREDENTIALS` for unknown email *and* wrong password; reject inactive accounts with `ACCOUNT_DISABLED`; return access token + set refresh cookie. **(UC-A1, UC-ST1)**
- [ ] **M1-03** Refresh-token rotation: store only a hash, revoke the old token on refresh, detect reuse and revoke the family. **(UC-ST1)**
- [ ] **M1-04** `POST /auth/logout` — revoke the presented refresh token, clear the cookie.
- [ ] **M1-05** Auth integration tests: login success/failure, inactive user, expired/invalid access token, refresh reuse, logout.
- [ ] **M1-06** Admin user management: list, create teacher, rename, deactivate/reactivate, reset password. Prevent deactivating the last active admin. **(UC-A1)**
- [ ] **M1-07** Teacher deactivation policy: block if they own planned sessions unless `reassignTo` is supplied; otherwise list the affected sessions. **(§10)**
- [ ] **M1-08** Settings endpoints: read/update singleton; validate `open < close`, stage end ≤ close, `gridMinutes` divides all times, non-empty operating days, valid IANA zone, min ≤ default ≤ max duration. **(UC-A2)**
- [ ] **M1-09** Closed-date management inside settings (list/add/remove with reason) and validation against the target week.
- [ ] **M1-10** Bootstrap script/command to create the first admin from env vars (idempotent).
- [ ] **M1-11** Warning/info response convention (`warnings: [{ code, severity, message }]`) documented and shared via a helper.
- [ ] **M1-12** Settings + users integration tests, including 403 for teacher and student callers.

**DoD:** a fresh database plus the bootstrap command yields a working admin;
login, refresh, logout and settings round-trip are covered by integration
tests; no endpoint leaks whether an email exists.

---

## Milestone 2 — Grades and groups

- [ ] **M2-01** Seed the grade catalogue (7th–9th `middle`, 10th–12th `high`) as an idempotent command. **(UC-A3)**
- [ ] **M2-02** `GET /grades` with stage, and admin endpoints to add a grade or group to the catalogue. **(UC-A3)**
- [ ] **M2-03** `GET /groups?active=` returning grade, number, student count, active flag and "cannot be recommended" reason.
- [ ] **M2-04** `PATCH /groups/:id` for activation and student count; active groups require `studentCount ≥ 1`. **(UC-G1, UC-G2)**
- [ ] **M2-05** Join code generation: crypto-random, unambiguous alphabet (no `0/O`, `1/I`), unique, 8 characters; `POST /groups/:id/join-code/regenerate` returns the old and new code. **(UC-G3)**
- [ ] **M2-06** Deactivation preview (`GET` or dry-run `PATCH`) listing affected planned sessions; require `confirm: true`. **(§10)**
- [ ] **M2-07** Deactivation transaction: soft-deactivate, remove the group from affected sessions, cancel sessions left with no groups, write history rows, notify students. **(§3.3)**
- [ ] **M2-08** Group integration tests: student count validation, join-code uniqueness/regeneration, deactivation with and without sessions.

**DoD:** the catalogue can be seeded and browsed; activation, student counts
and join codes behave as specified; deactivating a group never deletes history.

---

## Milestone 3 — Timetables

- [ ] **M3-01** `GET /groups/:id/timetable` — weekly view grouped by day, with total free minutes and the longest interval per day. **(UC-T2)**
- [ ] **M3-02** `PUT /groups/:id/timetable/:day` — replace the whole day atomically. **(UC-T1)**
- [ ] **M3-03** Normalization: forgiving time input, snap to grid (report adjustments), validate inside operating hours and `start < end`, reject intervals shorter than 15 minutes.
- [ ] **M3-04** Merge overlapping and adjacent intervals; return `warnings` describing what was merged.
- [ ] **M3-05** `POST /groups/:id/timetable/copy` — copy a day to several days and/or another group; merge on the target; report a per-target summary. **(UC-T3)**
- [ ] **M3-06** Impact check after a write: flag every planned session that is no longer fully free (`hasConflict = true`), return the affected list, never cancel. **(UC-SYS3, UC-S8)**
- [ ] **M3-07** `GET /grades/:id/availability` — heatmap of free student count per 15-minute or hourly bucket for the week. **(UC-T4)**
- [ ] **M3-08** *(optional)* CSV import for a group's week with a dry-run preview and row-level errors. **(UC-T5)**
- [ ] **M3-09** Timetable integration tests: overlap merge, adjacency merge, out-of-hours rejection, copy, conflict flagging, heatmap totals.

**DoD:** a non-technical teacher can replace Monday's free time in one call,
see what was merged, and learn which planned sessions now conflict.

---

## Milestone 4 — Recommendation engine

Step 1 (`generateCandidateWindows`) already exists. The remaining steps stay
pure and dependency-free.

- [ ] **M4-01** `computeCoverage(windows, groups, groupBusy, teacherBusy, config)` — bitmask per window; require the full duration after the buffer; apply the stage latest-end rule; exclude group-conflicting and teacher-conflicting windows; cap by room capacity and report `excludedByCapacity`.
- [ ] **M4-02** `rankWindows` — score = covered student count; tie-breakers: fewer uncovered groups, start inside preferred hours, earlier weekday, earlier start. Deterministic ordering.
- [ ] **M4-03** Merge adjacent windows with identical coverage into one range (`Mon 14:00–16:00`), preserving the earliest valid start.
- [ ] **M4-04** `buildCoveragePlan` — greedy by newly covered students, then remove redundant windows.
- [ ] **M4-05** Exact set cover (branch and bound with bitmask lower bound, or DP over group subsets) behind the same interface; guard for > 30 groups with a documented fallback to greedy.
- [ ] **M4-06** Uncoverable reasons: no slots, longest interval too short (with the longest value), all conflicts, stage end time, capacity only. Include an actionable hint ("try 45 minutes").
- [ ] **M4-07** `recommend()` orchestrator: validate the request (week is Monday, not in the past, duration within limits), call steps 1–5, return windows + plan + explanations.
- [ ] **M4-08** Service layer: load active groups (filtered by grade or explicit ids), free slots, teacher/group busy blocks, settings and closed dates; map to engine types; no business logic in the service.
- [ ] **M4-09** `POST /recommendations` validation and response mapping; 422 for invalid weeks/durations, `NO_ACTIVE_GROUPS`, `NO_CANDIDATE_WINDOWS` with helpful hints. **(UC-S1, UC-S2)**
- [ ] **M4-10** Stale-request support: include a hash/fingerprint of the inputs in the response for confirm-time revalidation.
- [ ] **M4-11** Suggest shorter durations when nothing fits (for example try 45, 30 minutes) and return them as `suggestions`.
- [ ] **M4-12** Engine tests: empty timetable, single group, perfectly aligned groups, disjoint groups, boundary start/end, buffer edges, capacity, closed dates, past windows, set cover known cases (greedy vs exact), determinism, performance with 30 groups × 6 days.
- [ ] **M4-13** Benchmark script comparing greedy and exact (session count, runtime) — data for the report.

**DoD:** the engine is a pure module with no Express/DB import, ≥ 95 % line
coverage, and the greedy vs exact comparison is reproducible from a script.

---

## Milestone 5 — Sessions and lifecycle

- [ ] **M5-01** Pure state machine (`canTransition(from, to, context)`) with plain-language rejection reasons; unit tests for every allowed and forbidden pair. **(§6)**
- [ ] **M5-02** `POST /sessions` from a recommendation: revalidate everything at confirm time; return `RECOMMENDATION_STALE` with a fresh recommendation when data changed. **(UC-S3)**
- [ ] **M5-03** Manual scheduling with `override: true`; without it return `SESSION_GROUPS_NOT_FREE` listing the groups and the exact conflicting intervals. **(UC-S4)**
- [ ] **M5-04** Transaction + advisory lock (or `SERIALIZABLE` + retry) around conflict re-check and insert, so two teachers cannot double-book a group. **(§10)**
- [ ] **M5-05** Idempotency: accept `Idempotency-Key` on create, store the key with the response, replay on retry.
- [ ] **M5-06** `PATCH /sessions/:id` — title, type, notes, time (planned only), full revalidation on time changes. **(UC-S5)**
- [ ] **M5-07** Transition endpoints: start, finish, postpone, reschedule, cancel; reason required where specified; `version` check → `SESSION_VERSION_CONFLICT`; append to status history in the same transaction. **(UC-S6)**
- [ ] **M5-08** Ownership checks: owning teacher or admin only; teachers can only schedule for themselves.
- [ ] **M5-09** `GET /sessions` filters (status, grade, from, to, teacher), stable ordering, pagination; `GET /sessions/:id` with groups and history. **(UC-S7)**
- [ ] **M5-10** Conflict resolution endpoint: list conflicted sessions and allow moving them or clearing `hasConflict` after review. **(UC-S8)**
- [ ] **M5-11** Notification hooks on create/postpone/reschedule/cancel (wired in milestone 6).
- [ ] **M5-12** Integration tests: overlap rejection, override path, every transition, optimistic-lock conflict, ownership, idempotent double submit.

**DoD:** every lifecycle arrow is enforced and audited; concurrent booking of
the same group is impossible; a session can always be traced from creation to
its final status.

---

## Milestone 6 — Students, notifications, scheduler

- [ ] **M6-01** `POST /auth/register-student` — email + password + join code; transaction resolves the active group, creates user and profile; rejects unknown/inactive group with a generic `INVALID_JOIN_CODE`. **(UC-ST1)**
- [ ] **M6-02** Student can read but not change their group; admin/teacher endpoint to move a student. **(§3.6)**
- [ ] **M6-03** `GET /me/sessions` — upcoming sessions targeting the student's group, with time, teacher, type and status. **(UC-ST2)**
- [ ] **M6-04** Notification fan-out helper: resolve students of the affected groups and insert notification rows inside the session transaction (no email).
- [ ] **M6-05** Notification copy catalogue for created/postponed/rescheduled/cancelled/updated. **(UC-ST3)**
- [ ] **M6-06** `GET /me/notifications` (paginated, unread count) and `PATCH /me/notifications/:id/read`; ownership enforced. **(UC-SYS2)**
- [ ] **M6-07** Scheduler job 1: `started` past `end + 30 min` → `finished`, with history and no duplicate runs. **(UC-SYS1)**
- [ ] **M6-08** Scheduler job 2: `planned` past `end` → `cancelled`, reason "Session was never started", students notified.
- [ ] **M6-09** Scheduler robustness: advisory lock so two instances do not double-process, per-row error isolation, metrics in logs.
- [ ] **M6-10** Zone-correct "past" checks using `zonedWallTimeToUtc`; DST tests around spring-forward and fall-back.
- [ ] **M6-11** Tests: registration with good/bad join code, deactivated group, notification fan-out, job idempotency.

**DoD:** a student who registers with a valid code sees only their group's
sessions and receives in-app notifications for every change; stale sessions
close themselves without manual intervention.

---

## Milestone 7 — Hardening, docs, demo

- [ ] **M7-01** OpenAPI 3.1 document generated from the Zod schemas (or hand-written), served in dev at `/docs`; every error code documented.
- [ ] **M7-02** Security pass: helmet CSP for the docs route, auth/registration rate limits verified, ownership tests for every `:id` route, generic login errors, password policy, cookie flags (`httpOnly`, `secure`, `sameSite`).
- [ ] **M7-03** DB second line of defense: `btree_gist` exclusion constraints for overlapping free slots per group and overlapping sessions per teacher (custom migration); verify indexes with `EXPLAIN` on the hot queries.
- [ ] **M7-04** Demo seed: 6 grades, 14 groups per grade in the catalogue, 4–6 active per grade, realistic timetables (including empty and too-short groups), 1 admin, 2 teachers, students, a few sessions in every status.
- [ ] **M7-05** Coverage gates: engine ≥ 95 %, services ≥ 80 %; add `npm run test:coverage` to CI.
- [ ] **M7-06** CI (GitHub Actions): typecheck, test, build, migration check on a Postgres service container.
- [ ] **M7-07** `docker-compose.yml` for local PostgreSQL (nice-to-have).
- [ ] **M7-08** Final docs: README screenshots/curl examples, engine explanation with the greedy vs exact table, decision log (PLAN §12), known limitations.
- [ ] **M7-09** Manual QA script: run the full teacher journey on the demo data (recommend → confirm → start → finish; timetable change → conflict → resolve; student registration → notification).

**DoD:** a fresh clone can be running against a seeded database in under ten
minutes; the demo scenario is repeatable; the report has numbers, diagrams and
a documented API.

---

## Out of scope (decided)

These were open questions and are intentionally **not** built. Keeping them
here prevents them from silently creeping back in.

- [ ] ~~Teacher availability timetables~~ — teachers have no availability; only their sessions block time (PLAN §12, decision 2).
- [ ] ~~Student attendance confirmation~~ — the session list is enough; no attendance states or tables (decision 3).
- [ ] ~~Email delivery~~ — in-app notifications only; no SMTP dependency (decision 4).
- [ ] ~~Per-teacher group ownership~~ — one shared catalogue of active groups (decision 1).

---

## Conventions for every task

1. Validation in `src/schemas/<feature>.schema.ts`, wired through `validate()`; handlers read `req.validated`.
2. Business rules in `*.service.ts`; SQL in `*.repository.ts`; no Drizzle types leak into controllers.
3. Errors are `AppError` with a stable `ErrorCode`, a plain message and, when useful, a hint.
4. Multi-row writes go through a transaction; status changes also write history.
5. Every new rule gets a test in the same PR: unit test for pure logic, supertest for the endpoint.
6. Times are minutes from midnight and ISO dates in the center zone; never `new Date()` inside the engine.
