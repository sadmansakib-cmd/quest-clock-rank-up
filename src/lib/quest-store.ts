// Task + XP state, persisted to Supabase (tables: tasks, player_progress).
// Updates apply locally first, then sync; components never touch storage.
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type Intensity, xpForIntensity } from "./game";

export interface Task {
  id: string;
  title: string;
  scheduledAt: string | null; // ISO
  intensity: Intensity;
  xp: number;
  done: boolean;
  completedAt: number | null;
  createdAt: number;
  timerMinutes: number | null;
  timerEndsAt: number | null;
  alarmFired: boolean;
  reminderFired: boolean;
}

export interface NewTaskInput {
  title: string;
  scheduledAt: string | null;
  intensity: Intensity;
  timerMinutes: number | null;
}

interface QuestState {
  tasks: Task[];
  xp: number;
}

const EMPTY: QuestState = { tasks: [], xp: 0 };

type Row = {
  id: string;
  title: string;
  scheduled_at: string | null;
  intensity: number;
  xp: number;
  done: boolean;
  completed_at: string | null;
  created_at: string;
  timer_minutes: number | null;
  timer_ends_at: string | null;
  alarm_fired: boolean;
  reminder_fired: boolean;
};

const ms = (v: string | null) => (v ? Date.parse(v) : null);
const iso = (v: number | null) => (v == null ? null : new Date(v).toISOString());

function fromRow(r: Row): Task {
  return {
    id: r.id,
    title: r.title,
    scheduledAt: r.scheduled_at,
    intensity: r.intensity as Intensity,
    xp: r.xp,
    done: r.done,
    completedAt: ms(r.completed_at),
    createdAt: Date.parse(r.created_at),
    timerMinutes: r.timer_minutes,
    timerEndsAt: ms(r.timer_ends_at),
    alarmFired: r.alarm_fired,
    reminderFired: r.reminder_fired,
  };
}

function toRow(p: Partial<Task>): Partial<Row> {
  const r: Partial<Row> = {};
  if ("title" in p) r.title = p.title;
  if ("scheduledAt" in p) r.scheduled_at = p.scheduledAt ?? null;
  if ("intensity" in p) r.intensity = p.intensity;
  if ("xp" in p) r.xp = p.xp;
  if ("done" in p) r.done = p.done;
  if ("completedAt" in p) r.completed_at = iso(p.completedAt ?? null);
  if ("timerMinutes" in p) r.timer_minutes = p.timerMinutes ?? null;
  if ("timerEndsAt" in p) r.timer_ends_at = iso(p.timerEndsAt ?? null);
  if ("alarmFired" in p) r.alarm_fired = p.alarmFired;
  if ("reminderFired" in p) r.reminder_fired = p.reminderFired;
  return r;
}

// Typed loosely so the store compiles before generated DB types refresh.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any;

function report(error: { message: string } | null) {
  if (error) {
    console.error("[quest-store]", error);
    toast.error("Couldn't save to the database", { description: error.message });
  }
}

async function loadState(): Promise<QuestState> {
  const [tasksRes, progRes] = await Promise.all([
    db().from("tasks").select("*").order("created_at"),
    db().from("player_progress").select("xp").maybeSingle(),
  ]);
  report(tasksRes.error);
  report(progRes.error);
  return {
    tasks: ((tasksRes.data ?? []) as Row[]).map(fromRow),
    xp: progRes.data?.xp ?? 0,
  };
}

export interface ToggleResult {
  done: boolean;
  gained: number;
  xpBefore: number;
  xpAfter: number;
}

export function useQuestStore(userId: string | null) {
  const [state, setState] = useState<QuestState>(EMPTY);
  const [ready, setReady] = useState(false);
  const ref = useRef(state);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    ref.current = EMPTY;
    setState(EMPTY);
    if (!userId) return;
    void loadState().then((loaded) => {
      if (cancelled) return;
      ref.current = loaded;
      setState(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const commit = useCallback((next: QuestState) => {
    ref.current = next;
    setState(next);
  }, []);

  const saveXp = useCallback(
    (xp: number) => {
      if (!userId) return;
      void db()
        .from("player_progress")
        .upsert({ user_id: userId, xp })
        .then(({ error }: { error: { message: string } | null }) => report(error));
    },
    [userId],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      const s = ref.current;
      commit({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
      void db()
        .from("tasks")
        .update(toRow(patch))
        .eq("id", id)
        .then(({ error }: { error: { message: string } | null }) => report(error));
    },
    [commit],
  );

  const addTask = useCallback(
    (input: NewTaskInput) => {
      if (!userId) return;
      const now = Date.now();
      const task: Task = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        scheduledAt: input.scheduledAt,
        intensity: input.intensity,
        xp: xpForIntensity(input.intensity),
        done: false,
        completedAt: null,
        createdAt: now,
        timerMinutes: input.timerMinutes,
        timerEndsAt: input.timerMinutes ? now + input.timerMinutes * 60_000 : null,
        alarmFired: false,
        // A time already in the past won't ring right away.
        reminderFired: input.scheduledAt ? Date.parse(input.scheduledAt) <= now : false,
      };
      const s = ref.current;
      commit({ ...s, tasks: [...s.tasks, task] });
      void db()
        .from("tasks")
        .insert({ id: task.id, user_id: userId, ...toRow(task), created_at: iso(now) })
        .then(({ error }: { error: { message: string } | null }) => report(error));
    },
    [commit, userId],
  );

  const toggleTask = useCallback(
    (id: string): ToggleResult | null => {
      const s = ref.current;
      const task = s.tasks.find((t) => t.id === id);
      if (!task) return null;
      const done = !task.done;
      const delta = done ? task.xp : -task.xp;
      const xpAfter = Math.max(0, s.xp + delta);
      const patch: Partial<Task> = {
        done,
        completedAt: done ? Date.now() : null,
        timerEndsAt: done ? null : task.timerEndsAt,
      };
      commit({ xp: xpAfter, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
      void db()
        .from("tasks")
        .update(toRow(patch))
        .eq("id", id)
        .then(({ error }: { error: { message: string } | null }) => report(error));
      saveXp(xpAfter);
      return { done, gained: delta, xpBefore: s.xp, xpAfter };
    },
    [commit, saveXp],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const s = ref.current;
      commit({ ...s, tasks: s.tasks.filter((t) => t.id !== id) });
      void db()
        .from("tasks")
        .delete()
        .eq("id", id)
        .then(({ error }: { error: { message: string } | null }) => report(error));
    },
    [commit],
  );

  const clearCompleted = useCallback(() => {
    const s = ref.current;
    const ids = s.tasks.filter((t) => t.done).map((t) => t.id);
    if (!ids.length) return;
    commit({ ...s, tasks: s.tasks.filter((t) => !t.done) });
    void db()
      .from("tasks")
      .delete()
      .in("id", ids)
      .then(({ error }: { error: { message: string } | null }) => report(error));
  }, [commit]);

  const startTimer = useCallback(
    (id: string, minutes: number) =>
      updateTask(id, {
        timerMinutes: minutes,
        timerEndsAt: Date.now() + minutes * 60_000,
        alarmFired: false,
      }),
    [updateTask],
  );

  const cancelTimer = useCallback(
    (id: string) => updateTask(id, { timerEndsAt: null, alarmFired: false }),
    [updateTask],
  );

  const markAlarmFired = useCallback(
    (id: string) => updateTask(id, { alarmFired: true, timerEndsAt: null }),
    [updateTask],
  );

  const markReminderFired = useCallback(
    (id: string) => updateTask(id, { reminderFired: true }),
    [updateTask],
  );

  return {
    ready,
    tasks: state.tasks,
    xp: state.xp,
    addTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    startTimer,
    cancelTimer,
    markAlarmFired,
    markReminderFired,
  };
}

/** Current signed-in user id (undefined while checking). */
export function useAuthUser() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setEmail(data.session?.user.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user.id ?? null);
      setEmail(session?.user.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { userId, email, signOut: () => supabase.auth.signOut() };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) return { error: error.message, needsConfirm: false };
  return { error: null, needsConfirm: !data.session };
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
