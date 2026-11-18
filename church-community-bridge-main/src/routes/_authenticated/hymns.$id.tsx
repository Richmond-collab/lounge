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
    queryFn: async () => {
      const { data, error } = await supabase.from("hymns").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Hymn;
    },
  });
  const { data: sameLanguage = [] } = useQuery({
    queryKey: ["hymns", "language", hymn?.language],
    enabled: !!hymn,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hymns")
        .select("id,hymn_number,language")
        .eq("is_published", true)
        .eq("language", hymn!.language)
        .order("hymn_number");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: translations = [] } = useQuery({
    queryKey: ["hymn-translations", hymn?.hymn_number],
    enabled: !!hymn,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hymns")
        .select("id,hymn_number,title,language")
        .eq("is_published", true)
        .eq("hymn_number", hymn!.hymn_number)
        .order("language");
      if (error) throw error;
      return data ?? [];
    },
  });
  const idx = sameLanguage.findIndex((h) => h.id === id);
  const prev = idx > 0 ? sameLanguage[idx - 1] : null;
  const next = idx >= 0 && idx < sameLanguage.length - 1 ? sameLanguage[idx + 1] : null;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <PageHeader title={hymn ? `${hymn.hymn_number}. ${hymn.title}` : "Hymn"} subtitle={hymn?.language ?? ""} />
      {isLoading && <p className="py-10 text-center text-muted-foreground">Loading…</p>}
      {error && <p className="py-10 text-center text-destructive">Failed to load hymn.</p>}
      {hymn && (
        <div className="mx-5 space-y-4">
          {translations.length > 1 && (
            <section className="rounded-2xl bg-card p-4" aria-label="Available language editions">
              <p className="mb-2 text-sm font-semibold">Available languages</p>
              <div className="flex flex-wrap gap-2">
                {translations.map((translation) => (
                  <Link
                    key={translation.id}
                    to="/hymns/$id"
                    params={{ id: translation.id }}
                    aria-current={translation.id === hymn.id ? "page" : undefined}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      translation.id === hymn.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                    }`}
                  >
                    {translation.language}
                  </Link>
                ))}
              </div>
            </section>
          )}
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
