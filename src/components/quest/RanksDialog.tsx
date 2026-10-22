import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RANKS, getRankIndex } from "@/lib/game";
import { cn } from "@/lib/utils";
import { RankBadge } from "./RankBadge";

export function RanksDialog({ xp }: { xp: number }) {
  const currentIdx = getRankIndex(xp);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="hud" size="sm" className="h-9 rounded-full">
          <Trophy className="text-accent" /> Ranks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Rank ladder</DialogTitle>
          <DialogDescription>
            30 ranks across 6 tiers. You have {xp} XP.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {RANKS.map((r) => {
            const locked = r.index > currentIdx;
            return (
              <div
                key={r.index}
                className={cn(
                  "flex flex-col items-center rounded-lg border p-3 text-center",
                  r.index === currentIdx ? "border-primary bg-primary/10 shadow-glow" : "border-border",
                )}
              >
                <RankBadge rank={r} size={64} locked={locked} />
                <span
                  className={cn(
                    "mt-1 font-display text-sm font-semibold uppercase",
                    locked ? "text-muted-foreground" : r.tier.textClass,
                  )}
                >
                  {r.name}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{r.minXp} XP</span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
