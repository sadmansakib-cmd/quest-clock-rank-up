// Pure game rules: intensity → XP, rank ladder, rank progress.

export type Intensity = 1 | 2 | 3 | 4 | 5;

export const INTENSITY_LEVELS: { level: Intensity; label: string; xp: number }[] = [
  { level: 1, label: "Easy", xp: 10 },
  { level: 2, label: "Normal", xp: 20 },
  { level: 3, label: "Hard", xp: 35 },
  { level: 4, label: "Intense", xp: 55 },
  { level: 5, label: "Epic", xp: 80 },
];

export function xpForIntensity(level: number): number {
  return INTENSITY_LEVELS.find((l) => l.level === level)?.xp ?? 10;
}

export type TierId = "iron" | "bronze" | "silver" | "gold" | "diamond" | "legend";

export interface Tier {
  id: TierId;
  name: string;
  textClass: string;
}

export const TIERS: Tier[] = [
  { id: "iron", name: "Iron", textClass: "text-tier-iron" },
  { id: "bronze", name: "Bronze", textClass: "text-tier-bronze" },
  { id: "silver", name: "Silver", textClass: "text-tier-silver" },
  { id: "gold", name: "Gold", textClass: "text-tier-gold" },
  { id: "diamond", name: "Diamond", textClass: "text-tier-diamond" },
  { id: "legend", name: "Legend", textClass: "text-tier-legend" },
];

const NUMERALS = ["I", "II", "III", "IV", "V"];
export const DIVISIONS_PER_TIER = 5;
export const RANK_COUNT = TIERS.length * DIVISIONS_PER_TIER; // 30

export interface Rank {
  index: number;
  name: string;
  tier: Tier;
  division: number; // 1..5
  numeral: string;
  minXp: number;
}

/** Cumulative XP needed to reach rank `index` (0-based). */
export function rankThreshold(index: number): number {
  if (index <= 0) return 0;
  return Math.round((30 * Math.pow(index, 1.55)) / 5) * 5;
}

export const RANKS: Rank[] = Array.from({ length: RANK_COUNT }, (_, i) => {
  const tier = TIERS[Math.floor(i / DIVISIONS_PER_TIER)]!;
  const d = i % DIVISIONS_PER_TIER;
  const numeral = NUMERALS[d]!;
  return {
    index: i,
    tier,
    division: d + 1,
    numeral,
    name: `${tier.name} ${numeral}`,
    minXp: rankThreshold(i),
  };
});

/** Rank at `index`, clamped to the ladder. */
export function getRank(index: number): Rank {
  return RANKS[Math.max(0, Math.min(RANK_COUNT - 1, index))]!;
}

export function getRankIndex(xp: number): number {
  let idx = 0;
  for (const r of RANKS) if (xp >= r.minXp) idx = r.index;
  return idx;
}

export function getRankProgress(xp: number) {
  const current = getRank(getRankIndex(xp));
  const next: Rank | null = RANKS[current.index + 1] ?? null;
  if (!next) {
    return { current, next, progress: 1, xpInto: xp - current.minXp, xpSpan: 0 };
  }
  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  return { current, next, progress: Math.min(1, into / span), xpInto: into, xpSpan: span };
}

/** Alarm at the task's chosen date/time: rings once, only for unfinished tasks. */
export function isReminderDue(
  task: { done: boolean; scheduledAt: string | null; reminderFired: boolean },
  now: number,
): boolean {
  if (task.done || task.reminderFired || !task.scheduledAt) return false;
  const at = Date.parse(task.scheduledAt);
  return !Number.isNaN(at) && at <= now;
}
