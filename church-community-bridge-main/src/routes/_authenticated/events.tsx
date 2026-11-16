import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — CAC" },
      { name: "description", content: "Church events calendar and RSVPs." },
      { property: "og:title", content: "Events — CAC" },
      { property: "og:description", content: "See what's happening and RSVP." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const me = useMe();
  const qc = useQueryClient();
  const [day, setDay] = useState<Date | undefined>();
  const { data: events = [] } = useQuery({
    queryKey: ["events", "all"],
    queryFn: async () =>
      (await supabase.from("events").select("*, event_rsvps(user_id, guests)").gte("starts_at", new Date(Date.now() - 86400000).toISOString()).order("starts_at")).data ?? [],
  });

  const toggle = useMutation({
    mutationFn: async ({ id, going }: { id: string; going: boolean }) => {
      const { error } = going
        ? await supabase.from("event_rsvps").delete().eq("event_id", id).eq("user_id", me.id)
        : await supabase.from("event_rsvps").insert({ event_id: id, user_id: me.id });
      if (error) throw error;
      return !going;
    },
    onSuccess: (nowGoing) => {
      toast.success(nowGoing ? "You're going! See you there." : "RSVP cancelled");
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error("Couldn't update RSVP"),
  });

  const eventDays = events.map((e) => new Date(e.starts_at));
  const shown = day ? events.filter((e) => new Date(e.starts_at).toDateString() === day.toDateString()) : events;

  return (
    <div>
      <PageHeader title="Events" subtitle="Gather with the church family" />
      <div className="mx-5 rounded-2xl bg-card p-2">
        <Calendar
          mode="single"
          selected={day}
          onSelect={setDay}
          modifiers={{ event: eventDays }}
          modifiersClassNames={{ event: "font-bold underline decoration-accent decoration-2 underline-offset-4" }}
          className="mx-auto"
        />
      </div>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold">{day ? formatDate(day, { dateStyle: "full" }) : "Upcoming"}</h2>
        {day && <button className="text-sm text-primary" onClick={() => setDay(undefined)}>Show all</button>}
      </div>
      <div className="space-y-3 px-5">
        {shown.map((e) => {
          const going = e.event_rsvps.some((r) => r.user_id === me.id);
          return (
            <div key={e.id} className="rounded-2xl bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatDate(e.starts_at)}</p>
              <h3 className="mt-1 text-lg font-bold">{e.title}</h3>
              <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatTime(e.starts_at)}{e.ends_at && ` – ${formatTime(e.ends_at)}`}</p>
                {e.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{e.location}</p>}
              </div>
              {e.description && <p className="mt-2 text-sm">{e.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{going ? "Your RSVP is confirmed" : "RSVP to attend"}</span>
                <Button size="sm" variant={going ? "secondary" : "default"} className="rounded-full" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: e.id, going })}>
                  {going ? <><Check className="h-4 w-4" /> Going</> : "RSVP"}
                </Button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <p className="py-8 text-center text-muted-foreground">No events on this day.</p>}
      </div>
    </div>
  );
}
