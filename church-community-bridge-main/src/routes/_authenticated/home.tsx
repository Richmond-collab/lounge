import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, LogOut, PlayCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home â€” CAC" },
      { name: "description", content: "Your CAC home: latest sermon, upcoming events and giving." },
      { property: "og:title", content: "Home â€” CAC" },
      { property: "og:description", content: "Latest sermon and upcoming events." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", me.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", me.id).maybeSingle()).data,
  });
  const { data: sermon } = useQuery({
    queryKey: ["sermons", "latest"],
    queryFn: async () => (await supabase.from("sermons").select("*").order("preached_on", { ascending: false }).limit(1).maybeSingle()).data,
  });
  const { data: events } = useQuery({
    queryKey: ["events", "upcoming", 2],
    queryFn: async () => (await supabase.from("events").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(2)).data ?? [],
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <section className="bg-hero rounded-b-[2rem] px-5 pt-12 pb-8 text-primary-foreground">
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-80">{greet},</p>
          <button onClick={signOut} aria-label="Sign out" className="rounded-full p-2 opacity-80 hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <h1 className="text-3xl font-bold">{profile?.display_name ?? "Beloved"}</h1>
        <p className="mt-3 font-display text-lg italic opacity-90">"Be still, and know that I am God." â€” Psalm 46:10</p>
      </section>

      <div className="space-y-6 px-5 pt-6">
        {sermon && (
          <Link to="/sermons/$id" params={{ id: sermon.id }} className="block overflow-hidden rounded-2xl bg-card shadow-soft">
            <div className="relative aspect-video">
              <img src={`https://img.youtube.com/vi/${sermon.youtube_id}/hqdefault.jpg`} alt={sermon.title} className="h-full w-full object-cover" />
              <PlayCircle className="absolute inset-0 m-auto h-14 w-14 text-primary-foreground drop-shadow-lg" />
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/70">Latest sermon</p>
              <h2 className="mt-1 text-xl font-bold">{sermon.title}</h2>
              <p className="text-sm text-muted-foreground">{sermon.speaker} Â· {formatDate(sermon.preached_on)}</p>
            </div>
          </Link>
        )}

        <Link to="/give" className="flex items-center gap-4 rounded-2xl bg-accent p-5 text-accent-foreground">
          <Gift className="h-8 w-8" />
          <div>
            <p className="font-display text-lg font-bold">Give tithes & offerings</p>
            <p className="text-sm opacity-80">Support the work of the ministry</p>
          </div>
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Coming up</h2>
            <Link to="/events" className="text-sm text-primary">See all</Link>
          </div>
          <div className="space-y-3">
            {events?.map((e) => (
              <div key={e.id} className="flex gap-4 rounded-2xl bg-card p-4">
                <div className="flex w-14 flex-col items-center justify-center rounded-xl bg-secondary py-2">
                  <span className="text-xs uppercase text-muted-foreground">{formatDate(e.starts_at, { month: "short" })}</span>
                  <span className="font-display text-2xl font-bold">{new Date(e.starts_at).getDate()}</span>
                </div>
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(e.starts_at)}</p>
                  {e.location && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{e.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
        <Button variant="ghost" onClick={signOut} className="w-full text-muted-foreground">Sign out</Button>
      </div>
    </div>
  );
}
