import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PlayCircle, CalendarDays, HandHeart, Users, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Christ Apostolic Church — Member App" },
      { name: "description", content: "Watch sermons, RSVP to events, share prayer requests, give and connect with CAC groups." },
      { property: "og:title", content: "Christ Apostolic Church — Member App" },
      { property: "og:description", content: "Sermons, events, prayer, giving and fellowship for the CAC family." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: PlayCircle, label: "Sermons" },
  { icon: CalendarDays, label: "Events" },
  { icon: HandHeart, label: "Prayer" },
  { icon: Gift, label: "Giving" },
  { icon: Users, label: "Groups" },
];

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  return (
    <main className="bg-hero flex min-h-screen flex-col px-6 pb-10 pt-16 text-primary-foreground">
      <img src="/icon-192.png" alt="" width={72} height={72} className="rounded-2xl shadow-soft" />
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Welcome home</p>
      <h1 className="mt-3 text-5xl font-bold leading-tight">Christ Apostolic Church</h1>
      <p className="mt-4 max-w-sm text-lg opacity-80">
        Your church family in your pocket — worship, pray, give and grow together all week long.
      </p>
      <div className="mt-10 grid grid-cols-5 gap-2">
        {features.map((f) => (
          <div key={f.label} className="flex flex-col items-center gap-2 text-xs opacity-90">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <f.icon className="h-5 w-5 text-accent" />
            </span>
            {f.label}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-12">
        <Button asChild size="lg" className="h-14 w-full rounded-2xl bg-accent text-base text-accent-foreground hover:bg-accent/90">
          <Link to="/auth">Sign in or join</Link>
        </Button>
        <p className="mt-4 text-center text-xs opacity-60">
          Tip: add this app to your home screen from your browser's share menu.
        </p>
      </div>
    </main>
  );
}
