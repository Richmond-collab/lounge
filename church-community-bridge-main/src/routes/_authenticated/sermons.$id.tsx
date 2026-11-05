import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Headphones, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sermons/$id")({
  head: () => ({
    meta: [
      { title: "Sermon — CAC" },
      { name: "description", content: "Watch or listen to this sermon." },
      { property: "og:title", content: "Sermon — CAC" },
      { property: "og:description", content: "Watch or listen to this sermon." },
    ],
  }),
  component: SermonPage,
});

function SermonPage() {
  const { id } = Route.useParams();
  const [mode, setMode] = useState<"video" | "audio">("video");
  const { data: s } = useQuery({
    queryKey: ["sermon", id],
    queryFn: async () => (await supabase.from("sermons").select("*").eq("id", id).maybeSingle()).data,
  });
  if (!s) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const src = `https://www.youtube-nocookie.com/embed/${s.youtube_id}?playsinline=1&rel=0`;

  return (
    <div>
      <div className="px-5 pt-8 pb-3">
        <Link to="/sermons" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Sermons</Link>
      </div>
      <div className="flex gap-2 px-5 pb-3">
        {(["video", "audio"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium", mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
            {m === "video" ? <Video className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
            {m === "video" ? "Watch" : "Listen"}
          </button>
        ))}
      </div>
      {mode === "video" ? (
        <div className="aspect-video w-full bg-foreground">
          <iframe src={src} title={s.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        </div>
      ) : (
        <div className="mx-5 overflow-hidden rounded-2xl bg-hero p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <img src={`https://img.youtube.com/vi/${s.youtube_id}/mqdefault.jpg`} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <div>
              <p className="text-xs uppercase tracking-wider opacity-70">Audio mode</p>
              <p className="font-display text-lg font-bold">{s.title}</p>
            </div>
          </div>
          {/* Compact player: video hidden, sound plays */}
          <iframe src={src} title={`${s.title} audio`} className="mt-4 h-14 w-full rounded-lg" allow="autoplay; encrypted-media" />
          <p className="mt-2 text-xs opacity-70">Press play to listen. Keep the screen on for continuous playback.</p>
        </div>
      )}
      <div className="px-5 pt-5">
        {s.series && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.series}</p>}
        <h1 className="mt-1 text-2xl font-bold">{s.title}</h1>
        <p className="text-sm text-muted-foreground">{s.speaker} · {formatDate(s.preached_on, { dateStyle: "long" })}</p>
        {s.description && <p className="mt-4 leading-relaxed">{s.description}</p>}
      </div>
    </div>
  );
}
