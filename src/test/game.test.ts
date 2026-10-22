import { describe, expect, it } from "vitest";
import { RANKS, RANK_COUNT, getRank, getRankIndex, getRankProgress, xpForIntensity } from "@/lib/game";

describe("intensity XP", () => {
  it("maps intensity 1-5 to 10/20/35/55/80 XP", () => {
    expect([1, 2, 3, 4, 5].map(xpForIntensity)).toEqual([10, 20, 35, 55, 80]);
  });
});

describe("rank ladder", () => {
  it("has 30 ranks (within the 20–50 range)", () => {
    expect(RANK_COUNT).toBe(30);
    expect(RANKS).toHaveLength(30);
  });

  it("starts at Iron I with 0 XP and thresholds strictly increase", () => {
    expect(getRank(0).name).toBe("Iron I");
    expect(getRank(0).minXp).toBe(0);
    for (let i = 1; i < RANKS.length; i++) {
      expect(getRank(i).minXp).toBeGreaterThan(getRank(i - 1).minXp);
    }
  });

  it("ranks up exactly when the next threshold is reached", () => {
    const t = getRank(1).minXp;
    expect(getRankIndex(t - 1)).toBe(0);
    expect(getRankIndex(t)).toBe(1);
  });

  it("caps at the last rank", () => {
    const p = getRankProgress(getRank(29).minXp + 10_000);
    expect(p.current.index).toBe(29);
    expect(p.next).toBeNull();
    expect(p.progress).toBe(1);
  });
});

import { isReminderDue as due } from "@/lib/game";
describe("scheduled-time alarm", () => {
  const at = "2026-10-22T14:00:00.000Z";
  const t = Date.parse(at);
  it("rings at the chosen time", () => {
    expect(due({ done: false, scheduledAt: at, reminderFired: false }, t)).toBe(true);
  });
  it("does not ring before the chosen time", () => {
    expect(due({ done: false, scheduledAt: at, reminderFired: false }, t - 1000)).toBe(false);
  });
  it("rings only once", () => {
    expect(due({ done: false, scheduledAt: at, reminderFired: true }, t)).toBe(false);
  });
  it("does not ring for done tasks", () => {
    expect(due({ done: true, scheduledAt: at, reminderFired: false }, t)).toBe(false);
  });
});
