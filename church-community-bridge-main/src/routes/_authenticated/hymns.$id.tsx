import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/hymns/$id")({
  head: () => ({ meta: [{ title: "Hymn — CAC" }] }),
  component: HymnDetailPage,
});

interface Hymn { id: string; hymn_number: number; title: string; lyrics: string; language: string; category: string | null; audio_url: string | null; }

function HymnDetailPage() {
  const { id } = Route.useParams();
  const { data: hymn, isLoading, error } = useQuery({
    queryKey: ["hymn", id],
    queryFn: async () => (await supabase.from("hymns").select("*").eq("id", id).single()).data as Hymn,
  });
  const { data: all = [] } = useQuery({
    queryKey: ["hymns"],
    queryFn: async () => (await supabase.from("hymns").select("id,hymn_number,language").eq("is_published", true).order("hymn_number")).data ?? [],
  });
  const idx = all.findIndex((h: any) => h.id === id);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div className="pb-24">
      <PageHeader title={hymn ? `${hymn.hymn_number}. ${hymn.title}` : "Hymn"} subtitle={hymn?.language ?? ""} />
      {isLoading && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
      {error && <p className="py-10 text-center text-destructive">Failed to load hymn.</p>}
      {hymn && (
        <div className="mx-5 space-y-4">
          {hymn.category && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{hymn.category}</p>}
          {hymn.audio_url && (
            <div className="rounded-2xl bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Music className="h-4 w-4" /> Audio</div>
              <audio controls src={hymn.audio_url} className="w-full" />
            </div>
          )}
          <pre className="whitespace-pre-wrap rounded-2xl bg-card p-5 font-sans text-base leading-relaxed">{hymn.lyrics}</pre>
          <div className="flex justify-between pt-2">
            {prev ? <Link to="/hymns/$id" params={{ id: prev.id }} className="text-sm text-primary">← Prev</Link> : <span />}
            {next ? <Link to="/hymns/$id" params={{ id: next.id }} className="text-sm text-primary">Next →</Link> : <span />}
          </div>
        </div>
      )}
    </div>
  );
}
