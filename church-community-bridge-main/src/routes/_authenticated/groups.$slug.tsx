import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MessageCircle, Paperclip, Mic } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-me";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/groups/$slug")({
  head: () => ({
    meta: [
      { title: "Group â€” CAC" },
      { name: "description", content: "Group discussions and fellowship." },
      { property: "og:title", content: "Group â€” CAC" },
      { property: "og:description", content: "Group discussions and fellowship." },
    ],
  }),
  component: GroupPage,
});

function GroupPage() {
  const { slug } = Route.useParams();
  const me = useMe();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [composing, setComposing] = useState(false);

  const { data: group } = useQuery({
    queryKey: ["group", slug],
    queryFn: async () => (await supabase.from("groups").select("*, group_members(user_id)").eq("slug", slug).maybeSingle()).data,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["posts", group?.id],
    enabled: !!group,
    queryFn: async () =>
      (await supabase.from("posts").select("*, profiles(display_name), comments(id)").eq("group_id", group!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const joined = !!group?.group_members.some((m) => m.user_id === me.id);

  const membership = useMutation({
    mutationFn: async () => {
      const { error } = joined
        ? await supabase.from("group_members").delete().eq("group_id", group!.id).eq("user_id", me.id)
        : await supabase.from("group_members").insert({ group_id: group!.id, user_id: me.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(joined ? "You left the group" : "Welcome to the group!");
      qc.invalidateQueries({ queryKey: ["group", slug] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      let image_path: string | null = null;
      let audio_path: string | null = null;
      if (imageFile) {
        const path = `${group!.id}/${me.id}/${Date.now()}-${imageFile.name}`;
        const { error } = await supabase.storage.from("group-attachments").upload(path, imageFile);
        if (error) throw error;
        image_path = path;
      }
      if (audioFile) {
        const path = `${group!.id}/${me.id}/${Date.now()}-${audioFile.name}`;
        const { error } = await supabase.storage.from("group-attachments").upload(path, audioFile);
        if (error) throw error;
        audio_path = path;
      }
      const { error } = await supabase.from("posts").insert({ group_id: group!.id, user_id: me.id, title: title.trim(), body: body.trim(), image_path, audio_path });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setBody(""); setImageFile(null); setAudioFile(null); setComposing(false);
      qc.invalidateQueries({ queryKey: ["posts", group?.id] });
    },
    onError: () => toast.error("Couldn't post"),
  });

  if (!group) return <div className="p-10 text-center text-muted-foreground">Loadingâ€¦</div>;

  return (
    <div>
      <section className="bg-hero rounded-b-[2rem] px-5 pt-8 pb-8 text-primary-foreground">
        <Link to="/groups" className="inline-flex items-center gap-1 text-sm opacity-80"><ArrowLeft className="h-4 w-4" /> Community</Link>
        <h1 className="mt-5 text-3xl font-bold">{group.name}</h1>
        <p className="mt-2 opacity-80">{group.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm opacity-80">{group.group_members.length} members</span>
          <Button onClick={() => membership.mutate()} disabled={membership.isPending} className={joined ? "rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25" : "rounded-full bg-accent text-accent-foreground hover:bg-accent/90"}>
            {joined ? "Leave group" : "Join group"}
          </Button>
        </div>
      </section>

      <div className="space-y-3 px-5 pt-6">
        {joined && (composing ? (
          <form className="space-y-3 rounded-2xl bg-card p-4 shadow-soft border border-border" onSubmit={(e) => { e.preventDefault(); if (title.trim() && body.trim()) post.mutate(); }}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Discussion title" className="rounded-xl" />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} placeholder="Share an idea, question or encouragementâ€¦" className="min-h-28 rounded-xl" />
            <div className="flex gap-2 text-sm">
              <label className="flex items-center gap-1 cursor-pointer"><Paperclip className="h-4 w-4" /> Image <input type="file" accept="image/*" hidden onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} /></label>
              <label className="flex items-center gap-1 cursor-pointer"><Mic className="h-4 w-4" /> Audio <input type="file" accept="audio/*" hidden onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} /></label>
              {imageFile && <span className="truncate block">{imageFile.name}</span>}
              {audioFile && <span className="truncate block">{audioFile.name}</span>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setComposing(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={post.isPending || !title.trim() || !body.trim()}>Post</Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setComposing(true)} className="h-12 w-full rounded-xl">Start a discussion</Button>
        ))}
        {!joined && <p className="rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground">Join this group to start discussions.</p>}

        {posts.map((p) => (
          <Link key={p.id} to="/posts/$id" params={{ id: p.id }} className="block rounded-2xl bg-card p-4 shadow-sm border border-border">
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{p.profiles?.display_name}</span> Â· {timeAgo(p.created_at)}</p>
            <h3 className="mt-1 text-lg font-bold">{p.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MessageCircle className="h-3.5 w-3.5" /> {p.comments.length} replies</p>
          </Link>
        ))}
        {posts.length === 0 && <p className="py-8 text-center text-muted-foreground">No discussions yet.</p>}
      </div>
    </div>
  );
}
