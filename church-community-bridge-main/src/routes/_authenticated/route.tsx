import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Home, PlayCircle, CalendarDays, Users, BookOpen, Radio, MoreHorizontal, HandHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const primaryTabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/sermons", label: "Sermons", icon: PlayCircle },
  { to: "/events", label: "Events", icon: CalendarDays },
] as const;

const moreTabs = [
  { to: "/prayer", label: "Prayer", icon: HandHeart },
  { to: "/hymns", label: "Hymns", icon: BookOpen },
  { to: "/live", label: "Live", icon: Radio },
] as const;

function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isWideRoute = path.startsWith("/home") || path.startsWith("/groups") || path.startsWith("/hymns");
  const isMoreActive = moreTabs.some((tab) => path.startsWith(tab.to));
  return (
    <div className={cn("mx-auto min-h-screen bg-background pb-24", isWideRoute ? "max-w-5xl" : "max-w-md")}>
      <Outlet />
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-stretch gap-1 px-2 py-1.5">
          {primaryTabs.map((tab) => {
            const active = path.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "fill-accent/30")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More sections"
                aria-current={isMoreActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors",
                  isMoreActive ? "text-primary" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={8}>
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <DropdownMenuItem key={tab.to} asChild>
                    <Link to={tab.to} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
}

