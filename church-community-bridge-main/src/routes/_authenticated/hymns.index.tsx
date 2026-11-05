import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Music, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/hymns/")({
  head: () => ({ meta: [{ title: "Hymns — CAC" }] }),
  component: HymnsPage,
});

interface Hymn { id: string; hymn_number: number; title: string; lyrics: string; language: string; category: string | null; audio_url: string | null; is_published: boolean; }

function HymnsPage() {
  const { user } = useMe();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("All");
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["hymns"],
    queryFn: async () => (await supabase.from("hymns").select("*").eq("is_published", true).order("hymn_number")).data ?? [],
  });
  const { data: favs = [] } = useQuery({
    queryKey: ["hymn-favourites", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("hymn_favourites").select("hymn_id").eq("user_id", user!.id)).data ?? [],
  });
  const favSet = new Set(favs.map((f: any) => f.hymn_id));
  const toggleFav = useMutation({
    mutationFn: async (hymnId: string) => {
      if (favSet.has(hymnId)) await supabase.from("hymn_favourites").delete().eq("user_id", user!.id).eq("hymn_id", hymnId);
      else await supabase.from("hymn_favourites").insert({ user_id: user!.id, hymn_id: hymnId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hymn-favourites", user?.id] }),
  });

  const filtered = data.filter((h: Hymn) => {
    const matchesLang = lang === "All" || h.language === lang;
    const matchesQ = `${h.hymn_number} ${h.title} ${h.lyrics}`.toLowerCase().includes(q.toLowerCase());
    return matchesLang && matchesQ;
  });

  return (
    <div>
      <PageHeader title="Hymn Book" subtitle="CAC Gospel Hymns" />
      <div className="mx-5 mb-3 flex gap-2">
        {["All", "English", "Yoruba"].map((l) => (
          <Button key={l} variant={lang === l ? "default" : "outline"} size="sm" onClick={() => setLang(l)}>{l}</Button>
        ))}
      </div>
      <div className="relative mx-5 mb-5">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number, title or lyrics" className="h-12 rounded-xl pl-11" />
      </div>
      {isLoading && <p className="py-10 text-center text-muted-foreground">Loading hymns…</p>}
      {error && <p className="py-10 text-center text-destructive">Failed to load hymns.</p>}
      {!isLoading && filtered.length === 0 && <p className="py-10 text-center text-muted-foreground">No hymns found. (Sample content may be added by an admin.)</p>}
      <div className="space-y-3 px-5 pb-24">
        {filtered.map((h: Hymn) => (
          <Link key={h.id} to="/hymns/$id" params={{ id: h.id }} className="flex items-center gap-3 rounded-2xl bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">{h.hymn_number}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{h.title}</p>
              <p className="text-xs text-muted-foreground">{h.language}{h.category ? ` · ${h.category}` : ""}</p>
            </div>
            {user && (
              <button onClick={(e) => { e.preventDefault(); toggleFav.mutate(h.id); }} aria-label="Toggle favourite">
                <Heart className={`h-5 w-5 ${favSet.has(h.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              </button>
            )}
            {h.audio_url && <Music className="h-4 w-4 text-muted-foreground" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
