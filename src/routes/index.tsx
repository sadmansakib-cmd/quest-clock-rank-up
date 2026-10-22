import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, isToday, isTomorrow, startOfDay } from "date-fns";
import { ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddTaskForm } from "@/components/quest/AddTaskForm";
import { AlarmOverlay } from "@/components/quest/AlarmOverlay";
import { ProgressHud } from "@/components/quest/ProgressHud";
import { RankBadge } from "@/components/quest/RankBadge";
import { RanksDialog } from "@/components/quest/RanksDialog";
import { RankUpModal } from "@/components/quest/RankUpModal";
import { TaskCard } from "@/components/quest/TaskCard";
import { AuthCard } from "@/components/quest/AuthCard";
import { getRank, getRankIndex, isReminderDue, type Rank } from "@/lib/game";
import { useAuthUser, useNow, useQuestStore, type Task } from "@/lib/quest-store";
import { playComplete, playRankUp, startAlarm } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Questlog — Level up your to-do list" },
      {
        name: "description",
        content: "Queue your tasks, earn XP by intensity, rank up through 30 tiers and get alarms on timers.",
      },
      { property: "og:title", content: "Questlog — Level up your to-do list" },
      {
        property: "og:description",
        content: "A game-style to-do tracker with XP, 30 ranks, rank-up sounds and task timers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function sortActive(a: Task, b: Task) {
  const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
  const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
  return ta - tb || a.createdAt - b.createdAt;
}

const dayKey = (iso: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd") : "none");

function dayLabel(key: string) {
  if (key === "none") return "Anytime";
  const d = new Date(`${key}T00:00`);
  if (isToday(d)) return `Today · ${format(d, "d MMM")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "d MMM")}`;
  return format(d, "EEE · d MMM yyyy");
}

function Index() {
  const auth = useAuthUser();
  if (auth.userId === undefined) return null;
  if (!auth.userId) return <AuthCard />;
  return <QuestApp userId={auth.userId} email={auth.email} onSignOut={auth.signOut} />;
}

function QuestApp({ userId, email, onSignOut }: { userId: string; email: string | null; onSignOut: () => void }) {
  const store = useQuestStore(userId);
  const now = useNow(1000);
  const [rankUp, setRankUp] = useState<Rank | null>(null);
  const [alarm, setAlarm] = useState<{ task: Task; kind: "timer" | "scheduled" } | null>(null);
  const alarmTask = alarm?.task ?? null;
  const [addOpen, setAddOpen] = useState(false);
  const [day, setDay] = useState<string>("all");
  const stopAlarmRef = useRef<(() => void) | null>(null);

  // Fire alarms: at the task's chosen time, and when a timer finishes
  useEffect(() => {
    if (!store.ready || alarm) return;
    const scheduled = store.tasks.find((t) => isReminderDue(t, now));
    const timer = scheduled
      ? undefined
      : store.tasks.find((t) => !t.done && t.timerEndsAt && !t.alarmFired && now >= t.timerEndsAt);
    const due = scheduled ?? timer;
    if (!due) return;
    if (scheduled) store.markReminderFired(due.id);
    else store.markAlarmFired(due.id);
    setAlarm({ task: due, kind: scheduled ? "scheduled" : "timer" });
    stopAlarmRef.current?.();
    stopAlarmRef.current = startAlarm();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(scheduled ? "⏰ It's time" : "⏰ Time's up", { body: due.title });
    }
  }, [now, store, alarm]);

  useEffect(() => () => stopAlarmRef.current?.(), []);

  const stopAlarm = useCallback(() => {
    stopAlarmRef.current?.();
    stopAlarmRef.current = null;
    setAlarm(null);
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      const res = store.toggleTask(id);
      if (!res) return;
      if (!res.done) {
        toast(`${res.gained} XP`, { description: "Task moved back to the queue" });
        return;
      }
      const before = getRankIndex(res.xpBefore);
      const after = getRankIndex(res.xpAfter);
      if (after > before) {
        playRankUp();
        setRankUp(getRank(after));
      } else {
        playComplete();
        toast.success(`+${res.gained} XP`, { description: "Task complete" });
      }
    },
    [store],
  );

  const todayStart = startOfDay(now).getTime();
  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date(todayStart), i)),
    [todayStart],
  );

  const active = store.tasks.filter((t) => !t.done).sort(sortActive);
  const filtered = day === "all" ? active : active.filter((t) => dayKey(t.scheduledAt) === day);
  const groups: { key: string; tasks: Task[] }[] = [];
  for (const t of filtered) {
    const k = dayKey(t.scheduledAt);
    const g = groups.find((x) => x.key === k);
    if (g) g.tasks.push(t);
    else groups.push({ key: k, tasks: [t] });
  }
  const done = store.tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const currentRank = getRank(getRankIndex(store.xp));
  const countByDay = (k: string) => active.filter((t) => dayKey(t.scheduledAt) === k).length;

  const cardProps = {
    now,
    onToggle: handleToggle,
    onDelete: store.deleteTask,
    onStartTimer: store.startTimer,
    onCancelTimer: store.cancelTimer,
  };

  let rowIndex = 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-5 sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <ListChecks className="size-5" />
            <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background bg-success" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">To do list</p>
            <p className="text-xs text-muted-foreground">{format(now, "EEEE, d MMMM")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full bg-card py-1 pl-1 pr-3 sm:flex">
            <RankBadge rank={currentRank} size={28} />
            <span className={cn("text-xs font-semibold", currentRank.tier.textClass)}>{currentRank.name}</span>
          </div>
          <RanksDialog xp={store.xp} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            title={email ?? undefined}
            className="h-8 rounded-lg text-xs text-muted-foreground hover:bg-card hover:text-foreground"
          >
            Sign out
          </Button>
        </div>
      </header>

      <ProgressHud xp={store.xp} tasks={store.tasks} />

      {/* Day strip */}
      <div className="mt-6 animate-fade-up [animation-delay:240ms]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{format(now, "MMMM yyyy")}</p>
          <button
            onClick={() => setDay("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              day === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All days
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const k = format(d, "yyyy-MM-dd");
            const sel = day === k;
            const n = countByDay(k);
            return (
              <button
                key={k}
                onClick={() => setDay(sel ? "all" : k)}
                aria-pressed={sel}
                className={cn(
                  "relative flex flex-col items-center rounded-xl py-2 transition-all duration-200",
                  sel
                    ? "bg-primary text-primary-foreground shadow-glow -translate-y-0.5"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-[10px] font-medium uppercase">{format(d, "EEE")}</span>
                <span className="font-display text-base font-bold tabular-nums">{format(d, "dd")}</span>
                <span
                  className={cn(
                    "mt-0.5 size-1 rounded-full transition-opacity",
                    n ? "opacity-100" : "opacity-0",
                    sel ? "bg-primary-foreground" : "bg-primary",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <Button
        variant="hero"
        size="lg"
        className="mt-4 h-11 w-full animate-fade-up [animation-delay:280ms]"
        onClick={() => setAddOpen(true)}
      >
        <Plus /> Create new task
      </Button>

      <main className="mt-6 space-y-6">
        <section key={day}>
          {!store.ready ? (
            <div className="h-16 animate-pulse rounded-xl bg-card" />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center animate-fade-up">
              <p className="font-display text-base font-semibold">Nothing in the queue</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {day === "all" ? "Create a task to start earning XP." : "No tasks planned for this day."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((g) => (
                <div key={g.key}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    {dayLabel(g.key)}
                  </p>
                  <ul className="space-y-2">
                    {g.tasks.map((t) => (
                      <TaskCard key={t.id} task={t} index={rowIndex++} {...cardProps} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {done.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-success">
                Completed · {done.length}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={store.clearCompleted}
                className="h-7 rounded-lg text-xs text-muted-foreground hover:bg-card hover:text-foreground"
              >
                Clear
              </Button>
            </div>
            <ul className="space-y-2">
              {done.map((t) => (
                <TaskCard key={t.id} task={t} {...cardProps} />
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Floating add button */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label="Add task"
        className="group fixed bottom-6 left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform duration-200 hover:scale-105 active:scale-95 animate-pop [animation-delay:350ms]"
      >
        <Plus className="size-6 transition-transform duration-300 group-hover:rotate-90" />
      </button>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-popover">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add task</DialogTitle>
            <DialogDescription>Plan what and when — tick it later to earn XP.</DialogDescription>
          </DialogHeader>
          <AddTaskForm
            onAdd={store.addTask}
            onDone={() => setAddOpen(false)}
            defaultDate={day === "all" ? "" : day}
          />
        </DialogContent>
      </Dialog>

      {rankUp && <RankUpModal rank={rankUp} onClose={() => setRankUp(null)} />}
      {alarmTask && (
        <AlarmOverlay
          task={alarmTask}
          kind={alarm!.kind}
          onStop={stopAlarm}
          onDone={() => {
            const id = alarmTask.id;
            stopAlarm();
            handleToggle(id);
          }}
        />
      )}
    </div>
  );
}
