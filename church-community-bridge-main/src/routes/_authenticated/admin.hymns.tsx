import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/admin/hymns")({
  head: () => ({ meta: [{ title: "Admin Hymns — CAC" }] }),
  component: AdminHymnsPage,
});

interface Hymn { id: string; hymn_number: number; title: string; lyrics: string; language: string; category: string | null; audio_url: string | null; is_published: boolean; }

function AdminHymnsPage() {
  const { user } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState({ hymn_number: "", title: "", lyrics: "", language: "English", category: "", audio_url: "", is_published: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data === true,
  });

  const { data = [] } = useQuery({
    queryKey: ["admin-hymns"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("hymns").select("*").order("hymn_number")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.hymn_number || !form.title || !form.lyrics) throw new Error("Required fields missing");
      const payload = { hymn_number: Number(form.hymn_number), title: form.title, lyrics: form.lyrics, language: form.language, category: form.category || null, audio_url: form.audio_url || null, is_published: form.is_published };
      if (editing) await supabase.from("hymns").update(payload).eq("id", editing);
      else await supabase.from("hymns").insert(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-hymns"] }); setForm({ hymn_number: "", title: "", lyrics: "", language: "English", category: "", audio_url: "", is_published: true }); setEditing(null); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { if (!confirm("Delete this hymn?")) return; await supabase.from("hymns").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hymns"] }),
  });

  const parseCsv = () => {
    const lines = csv.trim().split(/\n/).filter(Boolean);
    const rows = lines.map((l) => {
      const [hymn_number, title, language, category, lyrics, audio_url] = l.split("|");
      return { hymn_number: Number(hymn_number), title, language: language || "English", category, lyrics, audio_url };
    });
    setPreview(rows);
  };

  const importRows = useMutation({
    mutationFn: async () => {
      const existing = new Set(data.map((h: Hymn) => `${h.hymn_number}|${h.language}`));
      const toInsert = preview.filter((r) => r.hymn_number && r.title && r.lyrics && !existing.has(`${r.hymn_number}|${r.language}`));
      if (toInsert.length) await supabase.from("hymns").insert(toInsert.map((r) => ({ hymn_number: r.hymn_number, title: r.title, lyrics: r.lyrics, language: r.language, category: r.category || null, audio_url: r.audio_url || null })));
      return toInsert.length;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["admin-hymns"] }); alert(`Imported ${n} hymns.`); },
  });

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Admin access required.</div>;

  return (
    <div className="pb-24">
      <PageHeader title="Admin: Hymns" subtitle="Manage CAC hymn collection" />
      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">{editing ? "Edit hymn" : "Add hymn"}</h3>
          <Input placeholder="Hymn number" value={form.hymn_number} onChange={(e) => setForm({ ...form, hymn_number: e.target.value })} />
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="h-10 w-full rounded-md border px-2" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option>English</option><option>Yoruba</option>
          </select>
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Audio URL (authorized)" value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
          <textarea className="w-full rounded-md border p-2" rows={6} placeholder="Lyrics" value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} />
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Update" : "Add"}</Button>
          {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        </div>

        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">Bulk import (pipe-delimited: number|title|language|category|lyrics|audio_url)</h3>
          <textarea className="w-full rounded-md border p-2" rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={parseCsv}>Preview</Button>
            <Button onClick={() => importRows.mutate()} disabled={!preview.length || importRows.isPending}>Import new</Button>
          </div>
          {preview.length > 0 && <p className="text-xs text-muted-foreground">{preview.length} rows parsed; duplicates skipped on import.</p>}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Existing hymns ({data.length})</h3>
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
