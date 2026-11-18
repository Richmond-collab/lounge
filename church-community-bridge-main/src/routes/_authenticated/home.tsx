import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Gift, HandHeart, LogOut, MapPin, PlayCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — CAC" },
      { name: "description", content: "Your CAC home: latest sermon, upcoming events and giving." },
      { property: "og:title", content: "Home — CAC" },
      { property: "og:description", content: "Latest sermon and upcoming events." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, error: profileError } = useQuery({
    queryKey: ["profile", me.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", me.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: sermon, isLoading: sermonLoading, error: sermonError } = useQuery({
    queryKey: ["sermons", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sermons").select("*").order("preached_on", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["events", "upcoming", 2],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: announcement, isLoading: announcementLoading, error: announcementError } = useQuery({
    queryKey: ["announcements", "home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,body,category,is_pinned,published_at,created_at")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.cancelQueries();
    qc.clear();
    navigate({ to: "/auth", replace: true });
  }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const quickLinks = [
    { to: "/groups", title: "Groups", description: "Connect with members", icon: Users },
    { to: "/hymns", title: "Hymns", description: "Find a hymn to sing", icon: BookOpen },
    { to: "/prayer", title: "Prayer", description: "Share or support a request", icon: HandHeart },
    { to: "/events", title: "Events", description: "See what is coming up", icon: CalendarDays },
  ] as const;

  return (
    <div className="pb-24">
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 pb-9 pt-8 sm:px-8 sm:pb-12 sm:pt-12">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-80">{greet},</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{profile?.display_name ?? "Beloved"}</h1>
          <p className="mt-2 text-sm opacity-80">Welcome to your church community</p>
          <p className="mt-5 max-w-xl font-display text-lg italic opacity-90">
            "Be still, and know that I am God." — Psalm 46:10
          </p>
        </div>
      </section>

      {profileError && <p className="mx-5 mt-3 text-sm text-destructive">Couldn't load your profile: {profileError.message}</p>}

      <main className="mx-auto max-w-5xl space-y-7 px-5 py-6 sm:px-8 sm:py-8">
        <section aria-label="Quick links">
          <h2 className="mb-3 text-lg font-bold">Quick access</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {quickLinks.map(({ to, title, description, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/50 sm:p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{title}</span>
                  <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]">
          <div className="space-y-7">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Latest sermon</h2>
                <Link to="/sermons" className="text-sm font-medium text-primary hover:underline">All sermons</Link>
              </div>
              {sermonLoading && <div className="h-48 animate-pulse rounded-2xl bg-muted" />}
              {sermonError && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">Couldn't load sermons: {sermonError.message}</p>}
              {!sermonLoading && !sermonError && sermon && (
                <Link to="/sermons/$id" params={{ id: sermon.id }} className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={`https://img.youtube.com/vi/${sermon.youtube_id}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <PlayCircle className="absolute inset-0 m-auto h-14 w-14 text-primary-foreground drop-shadow-lg" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Featured message</p>
                    <h3 className="mt-1 text-lg font-bold">{sermon.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{sermon.speaker} · {formatDate(sermon.preached_on)}</p>
                  </div>
                </Link>
              )}
              {!sermonLoading && !sermonError && !sermon && (
                <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground">No sermons have been added yet.</p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Stay connected</p>
                  <h2 className="mt-1 text-xl font-bold">Church updates</h2>
                </div>
                <Link to="/announcements" className="shrink-0 text-sm font-medium text-primary hover:underline">All updates</Link>
              </div>
              {announcementLoading && <p className="py-3 text-sm text-muted-foreground">Loading updates…</p>}
              {announcementError && <p className="py-3 text-sm text-destructive">Couldn't load updates: {announcementError.message}</p>}
              {!announcementLoading && !announcementError && announcement && (
                <Link to="/announcements" className="block rounded-xl bg-muted/60 p-4 hover:bg-muted">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {announcement.is_pinned && <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary">Pinned</span>}
                    <span>{announcement.category}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={announcement.published_at ?? announcement.created_at}>
                      {formatDate(announcement.published_at ?? announcement.created_at)}
                    </time>
                  </div>
                  <h3 className="mt-2 font-semibold">{announcement.title}</h3>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{announcement.body}</p>
                </Link>
              )}
              {!announcementLoading && !announcementError && !announcement && (
                <p className="py-3 text-sm text-muted-foreground">No church updates right now.</p>
              )}
            </section>
          </div>

          <aside className="space-y-7">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold">Coming up</h2>
                <Link to="/events" className="text-sm font-medium text-primary hover:underline">See all</Link>
              </div>
              {eventsLoading && <div className="h-32 animate-pulse rounded-2xl bg-muted" />}
              {eventsError && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">Couldn't load events: {eventsError.message}</p>}
              {!eventsLoading && !eventsError && events.length === 0 && (
                <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">No upcoming events. Check back soon.</p>
              )}
              <div className="space-y-3">
                {events.map((event) => (
                  <article key={event.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary py-2">
                      <span className="text-xs uppercase text-muted-foreground">{formatDate(event.starts_at, { month: "short" })}</span>
                      <span className="font-display text-2xl font-bold">{new Date(event.starts_at).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatTime(event.starts_at)}</p>
                      {event.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{event.location}</span>
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <Link to="/give" className="flex items-center gap-4 rounded-2xl bg-accent p-5 text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-foreground/10">
                <Gift className="h-6 w-6" />
              </span>
              <span>
                <span className="block font-display text-lg font-bold">Give</span>
                <span className="mt-0.5 block text-sm opacity-80">Support the work of the ministry</span>
              </span>
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
