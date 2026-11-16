import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlayCircle, StopCircle, Radio, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/admin/live")({
  head: () => ({ meta: [{ title: "Admin Live — CAC" }] }),
  component: AdminLivePage,
});

interface Stream { id: string; title: string; status: string; stream_key: string | null; playback_url: string | null; started_at: string | null; created_at: string; }

function AdminLivePage() {
  const { user } = useMe();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [active, setActive] = useState<Stream | null>(null);

  const { data: streams = [] } = useQuery({
    queryKey: ["live-streams"],
    enabled: !!user,
    queryFn: async () => (await supabase.from("live_streams").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title required");
      const { error } = await supabase.from("live_streams").insert({ title: title.trim(), status: "idle" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["live-streams"] }); setTitle(""); },
  });

  const start = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_streams").update({ status: "live", started_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["live-streams"] }),
  });

  const end = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_streams").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["live-streams"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { if (!confirm("Delete stream?")) return; await supabase.from("live_streams").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["live-streams"] }),
  });

  return (
    <div className="pb-24">
      <PageHeader title="Admin: Live Streaming" subtitle="Manage live services" />
      <div className="mx-5 space-y-4">
        <div className="rounded-2xl bg-card p-4 space-y-3">
          <h3 className="font-semibold">Create new stream</h3>
          <Input placeholder="Stream title (e.g. Sunday Service)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button onClick={() => create.mutate()} disabled={create.isPending || !title.trim()}>Create Stream</Button>
          {create.isError && <p className="text-sm text-destructive">{(create.error as Error).message}</p>}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Streams</h3>
          {streams.length === 0 && <p className="text-muted-foreground text-sm">No streams yet.</p>}
          {streams.map((s: Stream) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-card p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{s.title}</span>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${s.status === "live" ? "bg-green-100 text-green-700" : s.status === "ended" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}`}>{s.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">Created {new Date(s.created_at).toLocaleDateString()}</p>
                {s.stream_key && <p className="text-xs text-muted-foreground">Stream key: {s.stream_key}</p>}
                {s.playback_url && <p className="text-xs text-muted-foreground">Playback: {s.playback_url}</p>}
              </div>
              <div className="flex gap-1">
                {s.status === "idle" && <Button size="sm" onClick={() => start.mutate(s.id)}>Go Live</Button>}
                {s.status === "live" && <Button size="sm" variant="destructive" onClick={() => end.mutate(s.id)}>End Stream</Button>}
                <Button size="sm" variant="outline" onClick={() => del.mutate(s.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
