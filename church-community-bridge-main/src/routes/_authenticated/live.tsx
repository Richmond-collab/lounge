import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/live")({
  head: () => ({ meta: [{ title: "Live — CAC" }] }),
  component: LivePage,
});

function LivePage() {
  return (
    <div className="pb-24">
      <PageHeader title="Live Stream" subtitle="Worship with us online" />
      <div className="mx-5 space-y-4">
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-card">
          <iframe
            src="https://www.youtube.com/embed/live_stream?channel=UCxxxxxxxx"
            title="YouTube Live"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">Live streams may be on YouTube or Facebook. Admin can update the embed URL.</p>
      </div>
    </div>
  );
}
