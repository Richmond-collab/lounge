import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Home, PlayCircle, CalendarDays, HandHeart, Users, BookOpen, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/sermons", label: "Sermons", icon: PlayCircle },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/prayer", label: "Prayer", icon: HandHeart },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/hymns", label: "Hymns", icon: BookOpen },
  { to: "/live", label: "Live", icon: Radio },
] as const;

function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isWideRoute = path.startsWith("/groups") || path.startsWith("/hymns");
  return (
    <div className={cn("mx-auto min-h-screen bg-background pb-24", isWideRoute ? "max-w-5xl" : "max-w-md")}>
      <Outlet />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md gap-1 overflow-x-auto px-2 py-2">
          {tabs.map((t) => {
            const active = path.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={cn("flex min-w-[64px] flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                <t.icon className={cn("h-5 w-5", active && "fill-accent/30")} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

