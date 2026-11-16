import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle, Radio, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({ meta: [{ title: "Live — CAC" }] }),
  component: LivePage,
});

interface Stream { id: string; title: string; status: string; playback_url: string | null; }

function LivePage() {
  const { data: streams = [] } = useQuery({
    queryKey: ["live-streams"],
    queryFn: async () => (await supabase.from("live_streams").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const live = streams.find((s) => s.status === "live");

  return (
    <div className="pb-24">
      <PageHeader title="Live Stream" subtitle="Watch CAC services live" />
      <div className="mx-5 space-y-4">
        {live && live.playback_url ? (
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black mb-3">
              <video
                src={live.playback_url}
                playsInline
                autoPlay
                muted
                controls
                className="h-full w-full"
                poster="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&q=80"
              />
            </div>
            <h2 className="text-xl font-bold">{live.title}</h2>
            <p className="text-sm text-muted-foreground">Now streaming — tap to watch full screen.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-8 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">No live stream right now</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back for the next CAC service.</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Admin can start a stream from the Admin Dashboard. Stream keys are shown there for OBS or webcam streaming apps.
        </p>
      </div>
    </div>
  );
}
