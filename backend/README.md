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
