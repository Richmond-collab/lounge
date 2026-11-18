import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/announcements/")({
  head: () => ({ meta: [{ title: "Announcements — CAC" }] }),
  component: AnnouncementsPage,
});

interface Announcement { id: string; title: string; body: string; category: string; is_pinned: boolean; image_url: string | null; published_at: string | null; created_at: string; }

const CATS = ["All", "General", "Worship", "Events", "Youth", "Prayer", "Important"];

function AnnouncementsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("is_published", true).order("is_pinned", { ascending: false }).order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const filtered = data.filter((a: Announcement) => (cat === "All" || a.category === cat) && `${a.title} ${a.body}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pb-24">
      <PageHeader title="Announcements" subtitle="Church updates" />
      <div className="mx-5 mb-3 flex flex-wrap gap-2">
        {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-sm ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c}</button>)}
      </div>
      <div className="relative mx-5 mb-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search announcements" className="h-12 rounded-xl pl-11" />
      </div>
      {isLoading && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
      {error && <p className="py-10 text-center text-destructive">Failed to load.</p>}
      {!isLoading && filtered.length === 0 && <p className="py-10 text-center text-muted-foreground">No announcements.</p>}
      <div className="space-y-3 px-5">
        {filtered.map((a: Announcement) => (
          <div key={a.id} className="rounded-2xl bg-card p-4">
            {a.is_pinned && <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary"><Pin className="h-3 w-3" /> Pinned</div>}
            {a.image_url && <img src={a.image_url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
            <p className="font-semibold">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.category} · {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
