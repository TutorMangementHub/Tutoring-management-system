import { describe, expect, it } from "vitest";
import { generateCandidateWindows } from "../windows.js";
import type { EngineConfig } from "../types.js";

const config: EngineConfig = {
  timeZone: "UTC",
  openMin: 480,
  closeMin: 1200,
  latestEndMinByStage: { middle: 1080, high: 1200 },
  operatingDays: [1, 2, 3, 4, 5, 6],
  closedDates: [],
  gridMinutes: 15,
  bufferMinutes: 15,
  minDurationMinutes: 30,
  maxDurationMinutes: 180,
  maxStudentsPerSession: 30,
  preferredStartMin: 840,
  preferredEndMin: 1080,
  minLeadMinutes: 120,
};

const weekStart = "2026-11-09"; // Monday
const now = new Date("2026-11-08T00:00:00Z");

describe("generateCandidateWindows", () => {
  it("generates every grid-aligned start that fits inside operating hours", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [1],
      durationMin: 60,
      config,
      now,
    });

    // 08:00 .. 19:00 inclusive = 45 starts.
    expect(windows).toHaveLength(45);
    expect(windows[0]).toMatchObject({ date: "2026-11-09", startMin: 480, endMin: 540 });
    expect(windows.at(-1)).toMatchObject({ startMin: 1140, endMin: 1200 });
  });

  it("never returns a window that ends after closing time", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [1, 2, 3, 4, 5, 6],
      durationMin: 180,
      config,
      now,
    });

    expect(windows.length).toBeGreaterThan(0);
    for (const window of windows) {
      expect(window.endMin).toBeLessThanOrEqual(config.closeMin);
    }
  });

  it("skips closed dates", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [1, 2],
      durationMin: 60,
      config: { ...config, closedDates: ["2026-11-09"] },
      now,
    });

    expect(windows.every((w) => w.date !== "2026-11-09")).toBe(true);
    expect(windows.some((w) => w.date === "2026-11-10")).toBe(true);
  });

  it("skips days the center is not open", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [7], // Sunday
      durationMin: 60,
      config,
      now,
    });

    expect(windows).toEqual([]);
  });

  it("respects the optional start-time window", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [1],
      durationMin: 60,
      config,
      now,
      window: { startMin: 840, endMin: 960 },
    });

    expect(windows.map((w) => w.startMin)).toEqual([840, 855, 870, 885, 900]);
  });

  it("drops windows that start before now + minimum lead time", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [1],
      durationMin: 60,
      config,
      // 2026-11-09 09:00 UTC; lead time 2h => nothing before 11:00.
      now: new Date("2026-11-09T09:00:00Z"),
    });

    expect(windows[0]?.startMin).toBe(660);
  });

  it("returns an empty list when the duration does not fit at all", () => {
    const windows = generateCandidateWindows({
      weekStart,
      days: [1],
      durationMin: 800,
      config,
      now,
    });

    expect(windows).toEqual([]);
  });
});
