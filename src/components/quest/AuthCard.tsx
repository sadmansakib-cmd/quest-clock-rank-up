import { useState, type FormEvent } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/quest-store";

export function AuthCard() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const err = await signIn(email.trim(), password);
      if (err) setMsg({ text: err, error: true });
    } else {
      const res = await signUp(email.trim(), password);
      if (res.error) setMsg({ text: res.error, error: true });
      else if (res.needsConfirm)
        setMsg({ text: "Check your email to confirm your account, then sign in.", error: false });
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 animate-fade-up">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
          <ListChecks className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Questlog</h1>
          <p className="text-xs text-muted-foreground">Sign in to save your quests and XP</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl bg-surface" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl bg-surface" />
        </div>
        {msg && <p className={msg.error ? "text-sm text-destructive" : "text-sm text-success"}>{msg.text}</p>}
        <Button type="submit" variant="hero" size="lg" className="h-11 w-full" disabled={busy}>
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
        <button
          type="button"
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
