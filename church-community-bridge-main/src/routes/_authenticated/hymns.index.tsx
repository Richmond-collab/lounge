import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Music, Heart, BookOpen } from "lucide-react";
import { toast } from "sonner";
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
  const user = useMe();
  const [q, setQ] = useState("");
  const [lang, setLang] = useState("All");
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const qc = useQueryClient();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["hymns"],
    queryFn: async (): Promise<Hymn[]> => {
      const pageSize = 500;
      const hymns: Hymn[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const { data: page, error } = await supabase
          .from("hymns")
          .select("*")
          .eq("is_published", true)
          .order("hymn_number")
          .order("language")
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        hymns.push(...page);
        if (page.length < pageSize) return hymns;
      }
    },
  });
  const { data: favs = [], error: favouritesError } = useQuery({
    queryKey: ["hymn-favourites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("hymn_favourites").select("hymn_id").eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) throw error;
      return data === true;
    },
  });
  const favSet = new Set(favs.map((f) => f.hymn_id));
  const toggleFav = useMutation({
    mutationFn: async (hymnId: string) => {
      const { error } = favSet.has(hymnId)
        ? await supabase.from("hymn_favourites").delete().eq("user_id", user!.id).eq("hymn_id", hymnId)
        : await supabase.from("hymn_favourites").insert({ user_id: user!.id, hymn_id: hymnId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hymn-favourites", user?.id] }),
    onError: (error) => toast.error(error.message || "Couldn't update favourite"),
  });

  const languages = ["All", ...new Set(data.map((h) => h.language).filter(Boolean).sort((a, b) => a.localeCompare(b)))];
  const normalizedQuery = normalizeSearchText(q.trim());
  const filtered = data.filter((h: Hymn) => {
    const matchesLang = lang === "All" || h.language === lang;
    const matchesQuery =
      !normalizedQuery ||
      normalizeSearchText(`${h.hymn_number} ${h.title} ${h.lyrics}`).includes(normalizedQuery);
    const matchesFavourite = !favouritesOnly || favSet.has(h.id);
    return matchesLang && matchesQuery && matchesFavourite;
  });

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <PageHeader title="Hymn Library" subtitle="Search by hymn number, title, lyrics, or language" />
      {isAdmin && (
        <div className="mx-auto mb-3 flex max-w-3xl justify-end px-5">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/hymns">Manage hymns</Link>
          </Button>
        </div>
      )}
      <div className="mx-auto mb-4 max-w-3xl space-y-3 px-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search any hymn by number, title, or lyrics"
            className="h-12 rounded-xl pl-11"
            aria-label="Search hymns"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            aria-label="Filter hymns by language"
            className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {languages.map((language) => <option key={language} value={language}>{language === "All" ? "All languages" : language}</option>)}
          </select>
          {user && (
            <Button
              variant={favouritesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFavouritesOnly((current) => !current)}
              className="h-10 shrink-0"
            >
              <Heart className={`mr-1 h-4 w-4 ${favouritesOnly ? "fill-current" : ""}`} />
              {favouritesOnly ? "Showing favourites" : "Favourites only"}
            </Button>
          )}
        </div>
      </div>
      {isLoading && <p className="py-10 text-center text-muted-foreground">Loading hymns…</p>}
      {error && <p className="py-10 text-center text-destructive">Failed to load hymns.</p>}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="mx-auto max-w-3xl px-5">
          <div className="rounded-2xl bg-card px-6 py-10 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{data.length ? "No hymns match your search." : "No hymns have been added yet."}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.length
                ? "Try another number, spelling, or language."
                : "A church administrator can import hymn editions that are authorized for sharing."}
            </p>
          </div>
        </div>
      )}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="mx-auto max-w-3xl px-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "hymn" : "hymns"}
            </p>
            {favouritesError && <p className="text-xs text-destructive">Favourites unavailable: {favouritesError.message}</p>}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {filtered.map((h: Hymn) => (
              <article key={h.id} className="flex min-w-0 items-center gap-3 border-b border-border p-3 last:border-b-0 sm:gap-4 sm:px-4">
                <Link
                  to="/hymns/$id"
                  params={{ id: h.id }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                    {h.hymn_number}
                  </span>
                  <span className="min-w-0 flex-1 py-1">
                    <span className="block truncate font-semibold leading-5">{h.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{h.language}</span>
                      {h.category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{h.category}</span>
                        </>
                      )}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {h.audio_url && <Music className="h-4 w-4 text-muted-foreground" aria-label="Audio available" />}
                  {user && (
                    <button
                      type="button"
                      onClick={() => toggleFav.mutate(h.id)}
                      aria-label={favSet.has(h.id) ? "Remove from favourites" : "Add to favourites"}
                      className="rounded-full p-1"
                    >
                      <Heart className={`h-5 w-5 ${favSet.has(h.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}
