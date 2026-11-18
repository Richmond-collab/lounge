import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/hymns")({
  head: () => ({ meta: [{ title: "Admin Hymns — CAC" }] }),
  component: AdminHymnsPage,
});

interface Hymn { id: string; hymn_number: number; title: string; lyrics: string; language: string; category: string | null; audio_url: string | null; is_published: boolean; }
interface HymnImportRow { hymn_number: number; title: string; language: string; category: string; lyrics: string; audio_url: string; }

function AdminHymnsPage() {
  const user = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState({ hymn_number: "", title: "", lyrics: "", language: "English", category: "", audio_url: "", is_published: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<HymnImportRow[]>([]);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data === true,
  });

  const { data = [], error: hymnsError } = useQuery({
    queryKey: ["admin-hymns"],
    enabled: !!isAdmin,
    queryFn: async (): Promise<Hymn[]> => {
      const pageSize = 500;
      const hymns: Hymn[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const { data: page, error } = await supabase
          .from("hymns")
          .select("*")
          .order("hymn_number")
          .order("language")
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        hymns.push(...page);
        if (page.length < pageSize) return hymns;
      }
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.hymn_number || !form.title.trim() || !form.lyrics.trim() || !form.language.trim()) {
        throw new Error("Hymn number, title, lyrics, and language are required.");
      }
      if (!Number.isInteger(Number(form.hymn_number)) || Number(form.hymn_number) < 1) {
        throw new Error("Hymn number must be a positive whole number.");
      }
      const payload = { hymn_number: Number(form.hymn_number), title: form.title, lyrics: form.lyrics, language: form.language, category: form.category || null, audio_url: form.audio_url || null, is_published: form.is_published };
      const { error } = editing
        ? await supabase.from("hymns").update(payload).eq("id", editing)
        : await supabase.from("hymns").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-hymns"] }); setForm({ hymn_number: "", title: "", lyrics: "", language: "English", category: "", audio_url: "", is_published: true }); setEditing(null); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Delete this hymn?")) return;
      const { error } = await supabase.from("hymns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hymns"] }),
    onError: (error) => toast.error(error.message || "Couldn't delete hymn"),
  });

  const parseCsv = () => {
    const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    const rows: HymnImportRow[] = lines.map((line) => {
      const [hymn_number = "", title = "", language = "", category = "", lyrics = "", audio_url = ""] = line.split("|");
      return {
        hymn_number: Number(hymn_number),
        title: title.trim(),
        language: language.trim() || "English",
        category: category.trim(),
        lyrics: lyrics.replace(/\\n/g, "\n").trim(),
        audio_url: audio_url.trim(),
      };
    });
    setPreview(rows);
  };

  const loadImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      setCsv(await file.text());
      setPreview([]);
      toast.success(`${file.name} loaded. Preview it before importing.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read the selected file");
    }
  };

  const importRows = useMutation({
    mutationFn: async () => {
      const existing = new Set(data.map((h: Hymn) => `${h.hymn_number}|${h.language}`));
      const toInsert = preview.filter((row) => {
        const key = `${row.hymn_number}|${row.language}`;
        if (
          !Number.isInteger(row.hymn_number) ||
          row.hymn_number < 1 ||
          !row.title.trim() ||
          !row.lyrics.trim() ||
          !row.language.trim() ||
          existing.has(key)
        ) {
          return false;
        }
        existing.add(key);
        return true;
      });
      if (toInsert.length) {
        const { error } = await supabase.from("hymns").insert(
          toInsert.map((r) => ({
            hymn_number: r.hymn_number,
            title: r.title,
            lyrics: r.lyrics,
            language: r.language,
            category: r.category || null,
            audio_url: r.audio_url || null,
          })),
        );
        if (error) throw error;
      }
      return toInsert.length;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["admin-hymns"] }); toast.success(`Imported ${n} hymns.`); },
    onError: (error) => toast.error(error.message || "Couldn't import hymns"),
  });

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Admin access required.</div>;

  return (
    <div className="pb-24">
      <PageHeader title="Admin: Hymns" subtitle="Manage authorized hymn editions and translations" />
      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">{editing ? "Edit hymn" : "Add hymn"}</h3>
          <Input placeholder="Hymn number" value={form.hymn_number} onChange={(e) => setForm({ ...form, hymn_number: e.target.value })} />
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Language (for example, Yoruba, Twi, or Ewe)" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Audio URL (authorized)" value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
          <textarea className="w-full rounded-md border p-2" rows={6} placeholder="Lyrics" value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} />
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Update" : "Add"}</Button>
          {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        </div>

        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">Import a hymn collection</h3>
          <p className="text-sm text-muted-foreground">
            Upload or paste a UTF-8 text file with one hymn per line:
            <code className="mt-1 block break-all rounded bg-muted p-2 text-xs">number|title|language|category|lyrics|audio_url</code>
            Use any language name. Put literal <code>\n</code> between stanzas. Audio URL is optional; only import text the church is authorized to share.
          </p>
          <Input type="file" accept=".txt,text/plain" aria-label="Choose formatted hymn text file" onChange={loadImportFile} />
          <textarea
            className="w-full rounded-md border p-2 font-mono text-sm"
            rows={10}
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              setPreview([]);
            }}
            placeholder={"1|[Hymn title]|English|Worship|[Authorized lyrics with \\n between stanzas]|"}
            aria-label="Hymn import data"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={parseCsv} disabled={!csv.trim()}>Preview import</Button>
            <Button onClick={() => importRows.mutate()} disabled={!preview.length || importRows.isPending}>
              {importRows.isPending ? "Importing…" : `Import ${preview.length} rows`}
            </Button>
          </div>
          {preview.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {preview.length} rows previewed. Existing and duplicate hymn number/language pairs are skipped.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing hymns ({data.length})</h3>
          {hymnsError && <p className="text-sm text-destructive">Couldn't load hymns: {hymnsError.message}</p>}
          {data.map((h: Hymn) => (
            <div key={h.id} className="flex items-center gap-2 rounded-xl bg-card p-3">
              <span className="font-bold">{h.hymn_number}</span>
              <span className="flex-1 truncate">{h.title} ({h.language})</span>
              <Button size="sm" variant="outline" onClick={() => { setEditing(h.id); setForm({ hymn_number: String(h.hymn_number), title: h.title, lyrics: h.lyrics, language: h.language, category: h.category ?? "", audio_url: h.audio_url ?? "", is_published: h.is_published }); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => del.mutate(h.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
