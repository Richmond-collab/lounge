import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { useMe } from "@/hooks/use-me";

export const Route = createFileRoute("/_authenticated/groups/")({
  head: () => ({
    meta: [
      { title: "Community Groups — CAC" },
      { name: "description", content: "Join youth, women's, men's and ministry groups to connect and discuss." },
      { property: "og:title", content: "Community Groups — CAC" },
      { property: "og:description", content: "Connect with fellow members in groups." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const me = useMe();
  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await supabase.from("groups").select("*, group_members(user_id)").order("name")).data ?? [],
  });

  return (
    <div>
      <PageHeader title="Community" subtitle="Building community together" />
      <div className="space-y-3 px-5">
        {groups.map((g) => {
          const joined = g.group_members.some((m) => m.user_id === me.id);
          return (
            <Link key={g.id} to="/groups/$slug" params={{ slug: g.slug }} className="flex items-center gap-4 rounded-2xl bg-card p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-hero text-accent">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{g.name}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{g.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{g.group_members.length} members{joined && " · Joined"}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
