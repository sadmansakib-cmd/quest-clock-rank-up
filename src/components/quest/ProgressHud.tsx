import { CheckCircle2, Star } from "lucide-react";
import { getRankProgress, RANK_COUNT } from "@/lib/game";
import type { Task } from "@/lib/quest-store";
import { RankBadge } from "./RankBadge";

export function ProgressHud({ xp, tasks }: { xp: number; tasks: Task[] }) {
  const { current, next, progress, xpInto, xpSpan } = getRankProgress(xp);
  const totalXp = tasks.reduce((s, t) => s + t.xp, 0);
  const doneXp = tasks.filter((t) => t.done).reduce((s, t) => s + t.xp, 0);
  const doneCount = tasks.filter((t) => t.done).length;
  const pct = totalXp ? Math.round((doneXp / totalXp) * 100) : 0;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {/* Central progress */}
      <div
        className="tile-blue relative col-span-2 overflow-hidden rounded-2xl p-5 text-on-tile shadow-glow animate-fade-up sm:col-span-3 sm:p-6"
      >
        <div aria-hidden className="absolute -right-10 -top-14 size-44 rounded-full bg-on-tile/10" />
        <div aria-hidden className="absolute -bottom-16 right-24 size-32 rounded-full bg-on-tile/5" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-on-tile/80">Today's progress</p>
              <p className="mt-1 flex items-baseline gap-1 font-display font-extrabold leading-none tabular-nums">
                <span className="text-6xl">{pct}</span>
                <span className="text-2xl text-on-tile/75">%</span>
              </p>
            </div>
            <span className="mt-1 rounded-full bg-on-tile/15 px-3 py-1 text-xs font-semibold tabular-nums">
              {doneCount} / {tasks.length} tasks
            </span>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-on-tile/20">
            <div
              className="h-full rounded-full bg-on-tile transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-on-tile/75 tabular-nums">
            {doneXp} of {totalXp} XP collected
          </p>
        </div>
      </div>

      {/* Rank */}
      <div
        className="tile-violet relative col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-on-tile animate-fade-up [animation-delay:80ms] sm:col-span-1 sm:flex-col sm:items-start sm:gap-2"
      >
        <div className="animate-float">
          <RankBadge rank={current} size={64} />
        </div>
        <div className="min-w-0 flex-1 sm:w-full">
          <p className="text-[11px] font-medium text-on-tile/75">
            Rank {current.index + 1} / {RANK_COUNT}
          </p>
          <p className="truncate font-display text-lg font-bold leading-tight">{current.name}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-on-tile/20">
            <div
              className="h-full rounded-full bg-on-tile transition-[width] duration-700 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-on-tile/75 tabular-nums">
            {next ? `${xpInto} / ${xpSpan} XP → ${next.name}` : "Max rank reached"}
          </p>
        </div>
      </div>

      {/* Done */}
      <div className="tile-sunset flex flex-col justify-between rounded-2xl p-4 text-on-tile animate-fade-up [animation-delay:140ms]">
        <CheckCircle2 className="size-6 text-on-tile/90" />
        <div className="mt-4">
          <p className="font-display text-3xl font-extrabold leading-none tabular-nums">{doneCount}</p>
          <p className="mt-1 text-xs text-on-tile/80">Completed</p>
        </div>
      </div>

      {/* XP */}
      <div className="tile-green flex flex-col justify-between rounded-2xl p-4 text-on-tile animate-fade-up [animation-delay:200ms]">
        <Star className="size-6 fill-on-tile/30 text-on-tile/90" />
        <div className="mt-4">
          <p className="font-display text-3xl font-extrabold leading-none tabular-nums">{xp}</p>
          <p className="mt-1 text-xs text-on-tile/80">Total XP</p>
        </div>
      </div>
    </section>
  );
}
