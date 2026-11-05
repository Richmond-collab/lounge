import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/use-me";
import { initials, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/posts/$id")({
  head: () => ({
    meta: [
      { title: "Discussion — CAC" },
      { name: "description", content: "Group discussion thread." },
      { property: "og:title", content: "Discussion — CAC" },
      { property: "og:description", content: "Group discussion thread." },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const me = useMe();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: post } = useQuery({
    queryKey: ["post", id],
    queryFn: async () =>
      (await supabase.from("posts").select("*, profiles(display_name), groups(slug, name), comments(*, profiles(display_name))").eq("id", id).order("created_at", { referencedTable: "comments" }).maybeSingle()).data,
  });

  const { data: imageUrl } = useQuery({
    queryKey: ["post-image", id],
    enabled: !!post?.image_path,
    queryFn: async () => (await supabase.storage.from("group-attachments").createSignedUrl(post!.image_path, 3600)).data?.signedUrl ?? null,
  });
  const { data: audioUrl } = useQuery({
    queryKey: ["post-audio", id],
    enabled: !!post?.audio_path,
    queryFn: async () => (await supabase.storage.from("group-attachments").createSignedUrl(post!.audio_path, 3600)).data?.signedUrl ?? null,
  });

  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("comments").insert({ post_id: id, user_id: me.id, body: reply.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setReply(""); qc.invalidateQueries({ queryKey: ["post", id] }); },
  });

  if (!post) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="pb-20">
      <div className="px-5 pt-8">
        {post.groups && (
          <Link to="/groups/$slug" params={{ slug: post.groups.slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> {post.groups.name}
          </Link>
        )}
        <h1 className="mt-4 text-2xl font-bold">{post.title}</h1>
        <p className="text-xs text-muted-foreground">{post.profiles?.display_name} · {timeAgo(post.created_at)}</p>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed">{post.body}</p>
        {imageUrl && <img src={imageUrl} alt="" className="mt-4 w-full rounded-2xl" />}
        {audioUrl && <audio controls src={audioUrl} className="mt-4 w-full" />}
      </div>
      <h2 className="px-5 pt-8 pb-3 text-lg font-bold">Replies ({post.comments.length})</h2>
      <div className="space-y-3 px-5">
        {post.comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">{initials(c.profiles?.display_name)}</span>
            <div className="flex-1 rounded-2xl bg-card p-3">
              <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{c.profiles?.display_name}</span> · {timeAgo(c.created_at)}</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      <form
        className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md gap-2 border-t bg-background p-3"
        onSubmit={(e) => { e.preventDefault(); if (reply.trim()) send.mutate(); }}
      >
        <Input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} placeholder="Write a reply…" className="h-11 rounded-full" />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" disabled={!reply.trim() || send.isPending} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
