import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { HandHeart, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/use-me";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prayer")({
  head: () => ({
    meta: [
      { title: "Prayer Wall — CAC" },
      { name: "description", content: "Share prayer requests and pray for one another." },
      { property: "og:title", content: "Prayer Wall — CAC" },
      { property: "og:description", content: "Share prayer requests and pray for one another." },
    ],
  }),
  component: PrayerPage,
});

function PrayerPage() {
  const me = useMe();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [priv, setPriv] = useState(false);

  const { data: prayers = [] } = useQuery({
    queryKey: ["prayers"],
    queryFn: async () =>
      (await supabase.from("prayer_requests").select("*, profiles(display_name), prayer_supports(user_id)").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("prayer_requests").insert({ user_id: me.id, body: body.trim(), is_anonymous: anon, is_private: priv });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody(""); setAnon(false); setPriv(false);
      toast.success(priv ? "Shared privately with the pastoral team" : "Your request was shared");
      qc.invalidateQueries({ queryKey: ["prayers"] });
    },
    onError: () => toast.error("Couldn't share request"),
  });

  const pray = useMutation({
    mutationFn: async ({ id, prayed }: { id: string; prayed: boolean }) => {
      const { error } = prayed
        ? await supabase.from("prayer_supports").delete().eq("prayer_id", id).eq("user_id", me.id)
        : await supabase.from("prayer_supports").insert({ prayer_id: id, user_id: me.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prayers"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("prayer_requests").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prayers"] }),
  });

  return (
    <div>
      <PageHeader title="Prayer Wall" subtitle="Bear one another's burdens — Galatians 6:2" />
      <form
        className="mx-5 space-y-3 rounded-2xl bg-card p-4 shadow-soft"
        onSubmit={(e) => { e.preventDefault(); if (body.trim().length > 2) add.mutate(); }}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} placeholder="What can we pray with you about?" className="min-h-24 rounded-xl" />
        <div className="flex items-center justify-between text-sm">
          <Label className="flex items-center gap-2"><Switch checked={anon} onCheckedChange={setAnon} /> Anonymous</Label>
          <Label className="flex items-center gap-2"><Switch checked={priv} onCheckedChange={setPriv} /> Pastors only</Label>
        </div>
        <Button type="submit" className="w-full rounded-xl" disabled={add.isPending || body.trim().length < 3}>Share request</Button>
      </form>

      <div className="space-y-3 px-5 pt-6">
        {prayers.map((p) => {
          const prayed = p.prayer_supports.some((s) => s.user_id === me.id);
          return (
            <article key={p.id} className="rounded-2xl bg-card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{p.is_anonymous ? "A church member" : p.profiles?.display_name}</span>
                <span className="flex items-center gap-1">{p.is_private && <Lock className="h-3 w-3" />}{timeAgo(p.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{p.body}</p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => pray.mutate({ id: p.id, prayed })}
                  className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium", prayed ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground")}
                >
                  <HandHeart className="h-4 w-4" /> {prayed ? "Praying" : "I'll pray"} · {p.prayer_supports.length}
                </button>
                {p.user_id === me.id && (
                  <button onClick={() => remove.mutate(p.id)} aria-label="Delete" className="p-2 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </article>
          );
        })}
        {prayers.length === 0 && <p className="py-8 text-center text-muted-foreground">Be the first to share a request.</p>}
      </div>
    </div>
  );
}
