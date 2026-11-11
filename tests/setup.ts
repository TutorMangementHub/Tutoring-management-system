/**
 * Vitest setup: provide deterministic environment values so importing the app
 * never depends on a developer's local `.env`.
 */
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/center_sessions_test";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-0123456789abcdef";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-0123456789abcdef";
