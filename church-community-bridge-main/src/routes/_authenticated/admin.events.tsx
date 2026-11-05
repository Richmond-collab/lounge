import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({ meta: [{ title: "Admin Events — CAC" }] }),
  component: AdminEventsPage,
});

interface E { id: string; title: string; description: string | null; location: string | null; starts_at: string; ends_at: string | null; }

function AdminEventsPage() {
  const { user } = useMe();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", location: "", starts_at: "", ends_at: "" });
  const [editing, setEditing] = useState<string | null>(null);

  const { data: isAdmin } = useQuery({ queryKey: ["is-admin", user?.id], enabled: !!user, queryFn: async () => (await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" })).data === true });
  const { data = [] } = useQuery({ queryKey: ["admin-events"], enabled: !!isAdmin, queryFn: async () => (await supabase.from("events").select("*").order("starts_at", { ascending: false })).data ?? [] });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.starts_at) throw new Error("Title and start date required");
      const payload = { title: form.title, description: form.description || null, location: form.location || null, starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null };
      if (editing) await supabase.from("events").update(payload).eq("id", editing);
      else await supabase.from("events").insert(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); setForm({ title: "", description: "", location: "", starts_at: "", ends_at: "" }); setEditing(null); },
  });

  const del = useMutation({ mutationFn: async (id: string) => { if (!confirm("Delete event?")) return; await supabase.from("events").delete().eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }) });

  if (!isAdmin) return <div className="p-6 text-center text-muted-foreground">Admin access required.</div>;

  return (
    <div className="pb-24">
      <PageHeader title="Admin: Events" subtitle="Manage church events" />
      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">{editing ? "Edit" : "New"} event</h3>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          <textarea className="w-full rounded-md border p-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{editing ? "Update" : "Create"}</Button>
          {save.isError && <p className="text-sm text-destructive">{(save.error as Error).message}</p>}
        </div>
        <div className="space-y-2">
          {data.map((e: E) => (
            <div key={e.id} className="flex items-center gap-2 rounded-xl bg-card p-3">
              <span className="flex-1 truncate">{e.title}</span>
              <Button size="sm" variant="outline" onClick={() => { setEditing(e.id); setForm({ title: e.title, description: e.description ?? "", location: e.location ?? "", starts_at: e.starts_at.slice(0,16), ends_at: e.ends_at ? e.ends_at.slice(0,16) : "" }); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => del.mutate(e.id)}>Delete</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
