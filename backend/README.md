# Tutoring Management API

This directory contains the normal Node.js API deployed to the VPS. It is not
an Azure Functions application.

## Runtime

- Node.js 24 or newer
- npm 11 or newer
- HTTP port `3000` by default
- Host `0.0.0.0` by default so the VPS can receive external traffic

## Endpoints

`GET /health` and `GET /api/health` return a JSON health response:

```json
{
  "status": "ok",
  "service": "tutoring-management-api",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

The root endpoint (`GET /`) returns basic service information. Unknown routes
return a JSON `404` response.

## Local development

```sh
npm ci
npm test
npm start
```

For automatic restart during development:

```sh
npm run dev
```

Override the defaults when needed:

```sh
PORT=3000 HOST=0.0.0.0 npm start
```

Test the running API with:

```sh
curl http://127.0.0.1:3000/health
```

## Database setup

Copy `.env.example` to `.env` and set `MONGODB_URI` to the remote MongoDB
database. The schema command is safe to re-run and creates or updates the
application collections, validators, and indexes:

```sh
npm ci
npm run db:schema
```

To create the initial grades, teacher account, and sample groups, also set
`TEACHER_EMAIL`, `TEACHER_PASSWORD`, and optionally `TEACHER_NAME`, then run:

```sh
npm run db:seed
```

Teachers are stored in the `users` collection with `role: "TEACHER"`; there
is intentionally no separate `teachers` collection. The schema includes the
`grades`, `groups`, `users`, `freeSlots`, `sessions`, and `notifications`
collections. Groups reference grades through `gradeId`, and the unique
`(gradeId, number)` index prevents duplicate group numbers within a grade.

## VPS deployment

The PM2 configuration in `ecosystem.config.cjs` runs the API from:

```text
/home/mo/Tutoring-management-system/backend
```

On the VPS, the initial setup is:

```sh
cd /home/mo/Tutoring-management-system/backend
npm ci --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
```

The GitHub Actions workflow updates the repository, installs production
dependencies, and restarts this PM2 process after a successful build.

## GitHub Actions secrets

The VPS deployment workflow requires these repository Actions secrets:

| Secret | Purpose |
| --- | --- |
| `SSH_HOST` | VPS public hostname or IP address |
| `SSH_USERNAME` | SSH user, currently `mo` |
| `SSH_PORT` | SSH port, normally `22` |
| `SSH_PRIVATE_KEY` | Private SSH key authorized on the VPS |
