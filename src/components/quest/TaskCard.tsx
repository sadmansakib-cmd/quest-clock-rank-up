import { useState, type CSSProperties } from "react";
import { format } from "date-fns";
import { Check, Star, Timer, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Task } from "@/lib/quest-store";
import { unlockAudio } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { IntensityTag } from "./IntensityPips";

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface Props {
  task: Task;
  now: number;
  index?: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartTimer: (id: string, minutes: number) => void;
  onCancelTimer: (id: string) => void;
}

export function TaskCard({ task, now, index = 0, onToggle, onDelete, onStartTimer, onCancelTimer }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const overdue = !task.done && task.scheduledAt && new Date(task.scheduledAt).getTime() < now;
  const running = !task.done && task.timerEndsAt;

  const start = (m: number) => {
    if (!m) return;
    unlockAudio();
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    onStartTimer(task.id, m);
    setOpen(false);
    setCustom("");
  };

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` } as CSSProperties}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card animate-fade-up transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-panel",
        task.done && "bg-card/60",
      )}
    >
      {task.done && (
        <div aria-hidden className="animate-fill-in absolute inset-0 origin-left bg-success/10" />
      )}
      <div className="relative flex items-center gap-3 px-3.5 py-3">
        <button
          onClick={() => onToggle(task.id)}
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90",
            task.done
              ? "border-success bg-success text-background"
              : "border-muted-foreground/60 hover:border-primary hover:bg-primary/15",
          )}
        >
          {task.done && <Check className="size-3.5 animate-pop" strokeWidth={3.5} />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold transition-colors",
              task.done && "text-muted-foreground line-through decoration-success/60",
            )}
          >
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <IntensityTag level={task.intensity} />
            {overdue && <span className="font-medium text-destructive">Overdue</span>}
            {running && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 py-0.5 pl-1.5 pr-0.5 font-semibold text-primary tabular-nums">
                <Timer className="size-3" />
                {formatCountdown(task.timerEndsAt! - now)}
                <button
                  onClick={() => onCancelTimer(task.id)}
                  aria-label="Cancel timer"
                  className="rounded p-0.5 hover:bg-primary/20"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5 text-[11px] tabular-nums">
          <span className="inline-flex items-center gap-1 font-semibold text-accent">
            <Star className="size-3.5 fill-accent" />
            {task.xp}
          </span>
          {task.scheduledAt && (
            <span className={cn("text-muted-foreground", overdue && "text-destructive")}>
              {format(new Date(task.scheduledAt), "HH:mm")}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center">
          {!task.done && !running && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Set timer"
                  className="size-8 rounded-lg text-muted-foreground hover:bg-primary/15 hover:text-primary"
                >
                  <Timer />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 space-y-3 rounded-xl" align="end">
                <p className="text-xs font-semibold text-muted-foreground">Remind me in…</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[5, 10, 15, 25, 45, 60].map((m) => (
                    <Button key={m} variant="hud" size="sm" onClick={() => start(m)}>
                      {m}m
                    </Button>
                  ))}
                </div>
                <form
                  className="flex gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    start(Math.min(600, Number(custom) || 0));
                  }}
                >
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="min"
                    className="h-8"
                  />
                  <Button type="submit" size="sm" className="rounded-lg">
                    Start
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            className="size-8 rounded-lg text-muted-foreground opacity-70 hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
