import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Bell, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INTENSITY_LEVELS, type Intensity } from "@/lib/game";
import type { NewTaskInput } from "@/lib/quest-store";
import { unlockAudio } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { TAG_DOT } from "./IntensityPips";

const TIMER_PRESETS = [0, 5, 15, 25, 45, 60];

function toIso(date: string, time: string): string | null {
  if (!date && !time) return null;
  const d = date || format(new Date(), "yyyy-MM-dd");
  const t = time || "09:00";
  const parsed = new Date(`${d}T${t}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

interface Props {
  onAdd: (input: NewTaskInput) => void;
  onDone?: () => void;
  defaultDate?: string;
}

export function AddTaskForm({ onAdd, onDone, defaultDate = "" }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [intensity, setIntensity] = useState<Intensity>(2);
  const [timer, setTimer] = useState(0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    unlockAudio();
    if ((timer > 0 || time) && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    onAdd({
      title,
      scheduledAt: toIso(date, time),
      intensity,
      timerMinutes: timer > 0 ? timer : null,
    });
    setTitle("");
    setTime("");
    setTimer(0);
    onDone?.();
  };

  const field = "h-11 rounded-xl border-input bg-surface";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Task name</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning running"
          className={field}
          maxLength={120}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date" className="flex items-center gap-1.5">
            <Calendar className="size-3.5" /> Date
          </Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time" className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> Time
          </Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Intensity</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {INTENSITY_LEVELS.map((l) => {
            const active = intensity === l.level;
            return (
              <button
                type="button"
                key={l.level}
                onClick={() => setIntensity(l.level)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-all duration-200",
                  active
                    ? "border-primary bg-primary/15 text-foreground -translate-y-0.5"
                    : "border-input bg-surface text-muted-foreground hover:border-primary/50",
                )}
              >
                <span className={cn("size-2 rounded-full", TAG_DOT[l.level])} />
                <span className="text-[11px] font-semibold">{l.label}</span>
                <span className="text-[10px] text-accent tabular-nums">★ {l.xp}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Bell className="size-3.5" /> Remind (timer alarm)
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {TIMER_PRESETS.map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setTimer(m)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums transition-colors",
                timer === m
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-surface text-muted-foreground hover:border-primary/50",
              )}
            >
              {m === 0 ? "Off" : `${m}m`}
            </button>
          ))}
          <Input
            type="number"
            min={1}
            max={600}
            value={TIMER_PRESETS.includes(timer) ? "" : timer}
            onChange={(e) => setTimer(Math.max(0, Math.min(600, Number(e.target.value) || 0)))}
            placeholder="min"
            className="h-8 w-20 rounded-lg bg-surface text-xs"
            aria-label="Custom timer minutes"
          />
        </div>
      </div>

      <Button type="submit" variant="hero" size="lg" className="mt-2 h-11 w-full" disabled={!title.trim()}>
        Confirm
      </Button>
    </form>
  );
}
