import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

const app = createApp();

describe("GET /health", () => {
  it("reports liveness and an x-request-id header", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "ok" });
    expect(response.headers["x-request-id"]).toBeTruthy();
  });
});

describe("unknown routes", () => {
  it("uses the documented error shape", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: expect.objectContaining({
        code: "NOT_FOUND",
        message: expect.any(String),
      }),
    });
    expect(response.body.error.requestId).toBeTruthy();
  });
});

describe("scaffolded endpoints", () => {
  it("rejects unauthenticated calls before reaching the stub", async () => {
    const response = await request(app).get("/sessions");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 501 for authenticated-but-unimplemented endpoints", async () => {
    const { signAccessToken } = await import("../../src/common/middleware/auth.js");
    const token = signAccessToken({
      sub: "00000000-0000-4000-8000-000000000001",
      role: "teacher",
      email: "teacher@example.com",
    });

    const response = await request(app)
      .get("/sessions")
      .set("authorization", `Bearer ${token}`);

    expect(response.status).toBe(501);
    expect(response.body.error.code).toBe("NOT_IMPLEMENTED");
  });
});
