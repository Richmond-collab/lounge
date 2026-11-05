import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sermons/")({
  head: () => ({
    meta: [
      { title: "Sermons — CAC" },
      { name: "description", content: "Watch and listen to Christ Apostolic Church sermons." },
      { property: "og:title", content: "Sermons — CAC" },
      { property: "og:description", content: "Watch and listen to recent sermons." },
    ],
  }),
  component: SermonsPage,
});

function SermonsPage() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["sermons"],
    queryFn: async () => (await supabase.from("sermons").select("*").order("preached_on", { ascending: false })).data ?? [],
  });
  const list = data.filter((s) => `${s.title} ${s.speaker} ${s.series ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Sermons" subtitle="Watch or listen anytime" />
      <div className="relative mx-5 mb-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, speaker or series" className="h-12 rounded-xl pl-11" />
      </div>
      <div className="space-y-4 px-5">
        {list.map((s) => (
          <Link key={s.id} to="/sermons/$id" params={{ id: s.id }} className="flex gap-4 rounded-2xl bg-card p-3">
            <img src={`https://img.youtube.com/vi/${s.youtube_id}/mqdefault.jpg`} alt="" loading="lazy" className="h-20 w-32 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              {s.series && <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.series}</p>}
              <p className="truncate font-semibold">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.speaker}</p>
              <p className="text-xs text-muted-foreground">{formatDate(s.preached_on)}</p>
            </div>
          </Link>
        ))}
        {list.length === 0 && <p className="py-10 text-center text-muted-foreground">No sermons found.</p>}
      </div>
    </div>
  );
}
