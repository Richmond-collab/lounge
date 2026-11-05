import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CAC Member App" },
      { name: "description", content: "Sign in or create your Christ Apostolic Church member account." },
      { property: "og:title", content: "Sign in — CAC Member App" },
      { property: "og:description", content: "Join the CAC family app." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/home`, data: { full_name: name } },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (!data.session) { toast.success("Check your email to confirm your account."); return; }
      navigate({ to: "/home" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      navigate({ to: "/home" });
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/home` } });
    if (error) { toast.error("Google sign-in failed"); return; }
  }

  return (
    <main className="min-h-screen bg-background px-6 pt-14 pb-10">
      <img src="/icon-192.png" alt="CAC" width={56} height={56} className="rounded-xl" />
      <h1 className="mt-6 text-3xl font-bold">{mode === "in" ? "Welcome back" : "Join the family"}</h1>
      <p className="mt-1 text-muted-foreground">Christ Apostolic Church member app</p>

      <Button variant="outline" className="mt-8 h-12 w-full rounded-xl" onClick={google}>
        Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "up" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
        </div>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl">
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button className="mt-6 w-full text-center text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "New here? Create an account" : "Already a member? Sign in"}
      </button>
    </main>
  );
}
