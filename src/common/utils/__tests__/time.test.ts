import { describe, expect, it } from "vitest";
import {
  addDays,
  formatMinutes,
  intervalContains,
  intervalsOverlap,
  isoDateOfWeek,
  isoWeekday,
  isValidIsoDate,
  mergeIntervals,
  parseTimeToMinutes,
  snapToGrid,
  todayInZone,
  zonedWallTimeToUtc,
} from "../time.js";

describe("parseTimeToMinutes", () => {
  it.each([
    ["8:30", 510],
    ["08:30", 510],
    ["8h30", 510],
    ["8H30", 510],
    ["20:00", 1200],
    ["8h", 480],
    ["0:00", 0],
    [510, 510],
  ])("parses %s", (input, expected) => {
    expect(parseTimeToMinutes(input)).toBe(expected);
  });

  it.each(["24:00", "8:75", "abc", "-1:00", "", 1440, -5])(
    "rejects %s",
    (input) => {
      expect(parseTimeToMinutes(input)).toBeNull();
    },
  );
});

describe("formatMinutes", () => {
  it("pads to HH:MM", () => {
    expect(formatMinutes(510)).toBe("08:30");
    expect(formatMinutes(0)).toBe("00:00");
    expect(formatMinutes(1439)).toBe("23:59");
  });
});

describe("snapToGrid", () => {
  it("leaves grid-aligned values untouched", () => {
    expect(snapToGrid(510)).toEqual({ value: 510, adjusted: false });
  });

  it("rounds to the nearest grid step and reports the adjustment", () => {
    expect(snapToGrid(512)).toEqual({ value: 510, adjusted: true });
    expect(snapToGrid(518)).toEqual({ value: 525, adjusted: true });
  });
});

describe("mergeIntervals", () => {
  it("merges overlapping intervals", () => {
    const result = mergeIntervals([
      { startMin: 720, endMin: 780 },
      { startMin: 750, endMin: 840 },
    ]);

    expect(result).toEqual({
      intervals: [{ startMin: 720, endMin: 840 }],
      merged: true,
    });
  });

  it("merges adjacent intervals", () => {
    const result = mergeIntervals([
      { startMin: 720, endMin: 780 },
      { startMin: 780, endMin: 840 },
    ]);

    expect(result.intervals).toEqual([{ startMin: 720, endMin: 840 }]);
    expect(result.merged).toBe(true);
  });

  it("sorts without flagging a merge when nothing overlaps", () => {
    const result = mergeIntervals([
      { startMin: 900, endMin: 960 },
      { startMin: 720, endMin: 780 },
    ]);

    expect(result.intervals).toEqual([
      { startMin: 720, endMin: 780 },
      { startMin: 900, endMin: 960 },
    ]);
    expect(result.merged).toBe(false);
  });

  it("handles an empty list", () => {
    expect(mergeIntervals([])).toEqual({ intervals: [], merged: false });
  });
});

describe("interval predicates", () => {
  it("detects overlap and containment", () => {
    const a = { startMin: 600, endMin: 720 };
    const b = { startMin: 660, endMin: 780 };
    const inside = { startMin: 630, endMin: 690 };

    expect(intervalsOverlap(a, b)).toBe(true);
    expect(intervalsOverlap(a, { startMin: 720, endMin: 780 })).toBe(false);
    expect(intervalContains(a, inside)).toBe(true);
    expect(intervalContains(inside, a)).toBe(false);
  });
});

describe("calendar helpers", () => {
  it("validates real ISO dates", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("26-02-28")).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-03-01", 1)).toBe("2026-03-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns ISO weekday numbers", () => {
    expect(isoWeekday("2026-11-09")).toBe(1); // Monday
    expect(isoWeekday("2026-11-15")).toBe(7); // Sunday
    expect(isoDateOfWeek("2026-11-09", 7)).toBe("2026-11-15");
  });
});

describe("zonedWallTimeToUtc", () => {
  it("converts a wall time in a fixed-offset zone", () => {
    // Africa/Algiers is UTC+1 all year.
    expect(zonedWallTimeToUtc("2026-01-15", 600, "Africa/Algiers").toISOString()).toBe(
      "2026-01-15T09:00:00.000Z",
    );
  });

  it("applies daylight saving time", () => {
    // Europe/Paris is UTC+2 in July.
    expect(zonedWallTimeToUtc("2026-07-15", 600, "Europe/Paris").toISOString()).toBe(
      "2026-07-15T08:00:00.000Z",
    );
  });

  it("formats today in the requested zone", () => {
    const now = new Date("2026-11-08T23:30:00Z");
    expect(todayInZone("UTC", now)).toBe("2026-11-08");
    expect(todayInZone("Africa/Algiers", now)).toBe("2026-11-09");
  });
});
