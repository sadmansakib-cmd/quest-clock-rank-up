import { BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/quest-store";

interface Props {
  task: Task;
  kind?: "timer" | "scheduled";
  onStop: () => void;
  onDone: () => void;
}

export function AlarmOverlay({ task, kind = "timer", onStop, onDone }: Props) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Timer finished"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-6 backdrop-blur-md animate-in fade-in"
    >
      <div className="hud-panel w-full max-w-sm p-8 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-accent">
          <BellRing className="size-10 animate-alarm" />
        </div>
        <p className="mt-5 font-display text-xs uppercase tracking-[0.4em] text-accent">{kind === "scheduled" ? "It's time" : "Time's up"}</p>
        <h2 className="mt-2 font-display text-2xl font-bold">{task.title}</h2>
        {kind === "scheduled" && task.scheduledAt && (
          <p className="mt-1 text-sm text-muted-foreground">
            Scheduled for {new Date(task.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {kind === "timer" && task.timerMinutes && (
          <p className="mt-1 text-sm text-muted-foreground">{task.timerMinutes} minute timer finished</p>
        )}
        <div className="mt-7 grid gap-2">
          <Button variant="hero" size="lg" onClick={onDone}>
            <Check /> Mark done · +{task.xp} XP
          </Button>
          <Button variant="hud" size="lg" onClick={onStop} autoFocus>
            Stop alarm
          </Button>
        </div>
      </div>
    </div>
  );
}
