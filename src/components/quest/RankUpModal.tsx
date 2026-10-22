import { useEffect, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { RANK_COUNT, type Rank } from "@/lib/game";
import { cn } from "@/lib/utils";
import { RankBadge } from "./RankBadge";

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const dist = 140 + (i % 4) * 40;
  return {
    dx: `${Math.cos(angle) * dist}px`,
    dy: `${Math.sin(angle) * dist}px`,
    delay: `${(i % 5) * 60}ms`,
    tone: i % 3,
  };
});

export function RankUpModal({ rank, onClose }: { rank: Rank; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Rank up: ${rank.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-6 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-sm uppercase tracking-[0.5em] text-accent animate-pop">
          Rank up!
        </p>
        <div className="relative mt-4 flex size-[240px] items-center justify-center">
          <div className="burst-rays animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2" />
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className={cn(
                "animate-burst absolute left-1/2 top-1/2 size-2 rotate-45",
                p.tone === 0 ? "bg-primary" : p.tone === 1 ? "bg-accent" : "bg-foreground",
              )}
              style={{ "--dx": p.dx, "--dy": p.dy, animationDelay: p.delay } as CSSProperties}
            />
          ))}
          <div className="animate-rank-in relative">
            <RankBadge rank={rank} size={220} />
          </div>
        </div>
        <h2
          className={cn(
            "mt-4 font-display text-5xl font-bold uppercase tracking-wide text-glow sm:text-6xl animate-pop",
            rank.tier.textClass,
          )}
        >
          {rank.name}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Rank {rank.index + 1} of {RANK_COUNT} unlocked
        </p>
        <Button variant="hero" size="lg" className="mt-8" onClick={onClose} autoFocus>
          Continue
        </Button>
      </div>
    </div>
  );
}
