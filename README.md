# Center Sessions

Backend for a multi-school support center: teachers publish their groups'
weekly free time, get ranked session recommendations for a target week, and
schedule, run and cancel sessions. Students register with a group join code
and follow their group's upcoming sessions in-app.

The full design is in **[PLAN.md](./PLAN.md)**; the work breakdown is in
**[TASKS.md](./TASKS.md)**.

> **Status: foundation scaffold.** The HTTP skeleton, error contract, database
> schema and migration, auth guards, and the first step of the recommendation
> engine are in place and tested (40 tests). Business endpoints currently
> return `501 NOT_IMPLEMENTED`; milestones 1–7 in `TASKS.md` fill them in.

---

## Decisions applied

The four open questions from the plan are resolved; the design below already
reflects them.

| # | Question | Decision |
|---|---|---|
| 1 | Who owns groups? | **Shared** catalogue of active groups for the whole center; no `teacher_id` on groups. |
| 2 | Teacher availability? | **None.** Only the teacher's existing sessions block time. |
| 3 | Student attendance? | **Not tracked.** The session list is the source of truth. |
| 4 | Notifications? | **In-app only.** No email provider. |

See [PLAN.md §12](./PLAN.md#12-resolved-decisions) for the consequences.

---

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node 24 (ESM), TypeScript 5.9 |
| HTTP | Express 5 |
| Database | PostgreSQL + Drizzle ORM / drizzle-kit |
| Validation | Zod 4 |
| Auth | Argon2id passwords, short-lived JWT access token, rotating refresh token in an httpOnly cookie |
| Ops | pino + pino-http, helmet, express-rate-limit, node-cron |
| Tests | Vitest + supertest |

---

## Quick start

Requirements: Node 24+, PostgreSQL 14+.

```bash
cp .env.example .env          # fill in DATABASE_URL and the JWT secrets
npm install
createdb center_sessions      # or use an existing database
npm run db:migrate
npm run dev
```

Check it:

```bash
curl http://localhost:3000/health
# {"status":"ok","uptimeSeconds":1}
```

`npm run db:seed` is a placeholder until milestone 7; there is no demo data
yet. `npm run db:generate` regenerates SQL after editing `src/db/schema.ts`.

### Environment

`src/config/env.ts` validates the environment at boot and fails with a
readable list of problems. Required: `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`. Everything else has a default; see `.env.example`.

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Watch mode with `tsx` |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `tests/` |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage for the engine and pure utils |
| `npm run db:generate` | Generate a migration from the Drizzle schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Demo data (milestone 7) |

---

## Project layout

```
.
├── src/
│   ├── app.ts                 # Express assembly: security, logging, routes, errors
│   ├── server.ts              # listen, scheduler, graceful shutdown
│   ├── routes.ts              # mounts every module router
│   ├── config/
│   │   ├── env.ts             # Zod-validated environment
│   │   └── constants.ts       # roles, statuses, session types, center defaults
│   ├── common/
│   │   ├── errors/            # AppError + stable ErrorCode catalogue
│   │   ├── middleware/        # auth, validate, rate limits, request-id, errors
│   │   ├── utils/             # pure time helpers, logger, async wrapper
│   │   └── types/             # Express request augmentation
│   ├── engine/                # pure recommendation engine (no Express, no DB)
│   │   ├── types.ts           # inputs/outputs of every step
│   │   ├── windows.ts         # step 1: candidate windows  [implemented]
│   │   └── __tests__/
│   ├── jobs/                  # node-cron scheduler + automatic transitions
│   ├── modules/               # one folder per module
│   │   └── <module>/          # .routes .controller .service .schema .repository
│   └── db/
│       ├── schema.ts          # Drizzle tables, enums, checks, indexes
│       ├── client.ts          # pg pool + Drizzle instance
│       └── seed.ts            # demo data (milestone 7)
├── drizzle/
│   └── 0000_init.sql          # initial migration (12 tables)
├── tests/
│   ├── setup.ts               # deterministic env for tests
│   └── integration/           # supertest suites
├── PLAN.md                    # design document, decisions
└── TASKS.md                   # milestone task list
```

Every module follows the same five files:

```
modules/sessions/
├── sessions.routes.ts         # paths + guards only
├── sessions.controller.ts     # thin: read req.validated, call service, respond
├── sessions.service.ts        # business rules, transactions
├── sessions.schema.ts         # Zod input schemas
└── sessions.repository.ts     # Drizzle queries, no Express types
```

---

## API surface

Guards are already enforced; handlers are stubs until their milestone.

| Method & path | Access | Milestone |
|---|---|---|
| `GET /health`, `GET /health/ready` | public | done |
| `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/register-student` | public / student | 1, 6 |
| `GET/PATCH /settings` | admin | 1 |
| `GET/POST/PATCH /users`, `POST /users/:id/reset-password` | admin | 1 |
| `GET /grades`, `GET /grades/:id/availability` | auth / teacher | 2, 3 |
| `GET /groups`, `PATCH /groups/:id`, `POST /groups/:id/join-code/regenerate` | auth / teacher | 2 |
| `GET /groups/:id/timetable`, `PUT /groups/:id/timetable/:day`, `POST /groups/:id/timetable/copy` | auth / teacher | 3 |
| `POST /recommendations` | teacher | 4 |
| `GET/POST /sessions`, `PATCH /sessions/:id` | teacher | 5 |
| `POST /sessions/:id/{start,finish,postpone,reschedule,cancel}` | teacher | 5 |
| `GET /me/sessions` | student | 6 |
| `GET /me/notifications`, `PATCH /me/notifications/:id/read` | auth | 6 |

`POST /recommendations` is read-only but uses POST because of its complex
request body.

---

## Error contract

Every failure uses one shape, produced by
`src/common/middleware/error-handler.ts`:

```json
{
  "error": {
    "code": "SESSION_TEACHER_CONFLICT",
    "message": "You already have a session on Monday from 14:00 to 15:00.",
    "hint": "Choose a different time or cancel the other session.",
    "details": [{ "field": "startTime", "message": "..." }],
    "requestId": "5f1c…"
  }
}
```

- Codes live in `src/common/errors/error-codes.ts` and are stable for clients.
- Messages are plain language; stack traces and driver errors never leave the
  server.
- Zod failures become `422 VALIDATION_ERROR` with field-level `details`.
- Unknown routes return `404 NOT_FOUND` in the same shape.
- `x-request-id` is echoed on every response and included in the body.

---

## Conventions

- **Times** are integer minutes from local midnight (`480` = 08:00). **Dates**
  are ISO `YYYY-MM-DD` in the configured center time zone. The engine never
  calls `new Date()`; "now" is injected.
- **The engine is pure.** `src/engine/` may only import its own files and pure
  helpers; it must never import Express, the DB, or the logger.
- **Forgiving input.** `8:30`, `08:30` and `8h30` all parse; times snap to the
  15-minute grid and the response reports the adjustment.
- **Warnings are not errors.** Allowed-but-notable outcomes (merged slots,
  short lead time, conflicts created by a timetable change) come back in a
  `warnings` array; blocked actions are `AppError`s.
- **Transactions for multi-row writes.** Status changes also append to
  `session_status_history`.

---

## Testing

```bash
npm test
npm run typecheck
```

Current suites:

| Suite | Covers |
|---|---|
| `src/common/utils/__tests__/time.test.ts` | time parsing, snapping, interval merging, ISO dates, zone/DST conversion |
| `src/engine/__tests__/windows.test.ts` | candidate window generation, closed dates, operating days, lead time, duration limits |
| `tests/integration/health.test.ts` | liveness, 404 shape, auth guard on stubs, `x-request-id` |

Planned: state-machine tests, engine set-cover tests, and one integration
suite per use case (see `TASKS.md`).

---

## Roadmap

1. Auth, roles, settings, error framework (milestone 1)
2. Grades and groups (milestone 2)
3. Timetables, merge logic, heatmap (milestone 3)
4. Recommendation engine: coverage, ranking, greedy + exact set cover (milestone 4)
5. Sessions, lifecycle, history (milestone 5)
6. Students, in-app notifications, scheduler jobs (milestone 6)
7. Hardening, OpenAPI, demo data, CI (milestone 7)

`TASKS.md` has the detailed checklist and the definition of done for each
milestone.
