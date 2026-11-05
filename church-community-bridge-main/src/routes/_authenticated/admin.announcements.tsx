import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Admin Announcements — CAC" }] }),
  component: AdminAnnouncementsPage,
});

interface A { id: string; title: string; body: string; category: string; is_published: boolean; is_pinned: boolean; image_url: string | null; }

function AdminAnnouncementsPage() {
  const { user } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", body: "", category: "General", is_published: false, is_pinned: false, image_url: "" });
  const [editing, setEditing] = useState<string | null>(null);

  const { data: isAdmin } = useQuery({ queryKey: ["is-admin", user?.id], enabled: !!user, queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data === true });
  const { data = [] } = useQuery({ queryKey: ["admin-announcements"], enabled: !!isAdmin, queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.body) throw new Error("Required fields missing");
      const payload = { title: form.title, body: form.body, category: form.category, is_published: form.is_published, is_pinned: form.is_pinned, image_url: form.image_url || null };
      if (editing) await supabase.from("announcements").update(payload).eq("id", editing);
      else await supabase.from("announcements").insert({ ...payload, created_by: user!.id });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); setForm({ title: "", body: "", category: "General", is_published: false, is_pinned: false, image_url: "" }); setEditing(null); },
  });

  const del = useMutation({ mutationFn: async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("announcements").delete().eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }) });

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Admin access required.</div>;

  return (
    <div className="pb-24">
      <PageHeader title="Admin: Announcements" subtitle="Manage church announcements" />
      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">{editing ? "Edit" : "New"} announcement</h3>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="h-10 w-full rounded-md border px-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {["General","Worship","Events","Youth","Prayer","Important"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <textarea className="w-full rounded-md border p-2" rows={5} placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Published</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} /> Pinned</label>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Update" : "Create"}</Button>
          {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        </div>
        <div className="space-y-2">
          {data.map((a: A) => (
            <div key={a.id} className="flex items-center gap-2 rounded-xl bg-card p-3">
              <span className="flex-1 truncate">{a.title}</span>
              <span className="text-xs text-muted-foreground">{a.is_published ? "Published" : "Draft"}</span>
              <Button size="sm" variant="outline" onClick={() => { setEditing(a.id); setForm({ title: a.title, body: a.body, category: a.category, is_published: a.is_published, is_pinned: a.is_pinned, image_url: a.image_url ?? "" }); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => del.mutate(a.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
