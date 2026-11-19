import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, RefreshCw, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";

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
  const { data: groups = [], isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*, group_members(user_id)")
        .eq("is_published", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    refetchOnMount: "always",
  });

  return (
    <div className="pb-24">
      <header className="flex items-center justify-between gap-3 px-5 py-5">
        <div>
          <h1 className="text-2xl font-bold">Community groups</h1>
          {!isLoading && <p className="mt-1 text-sm text-muted-foreground">{groups.length} groups</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Refresh group list"
        >
          <RefreshCw className={isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </header>
      {error && (
        <p role="alert" className="mx-5 mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          Couldn't refresh groups: {error.message}. If a group was just added, confirm this app uses the same Supabase project.
        </p>
      )}
      {isLoading && <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading groups…</p>}
      <div className="grid grid-cols-1 gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading && !error && groups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No groups available yet.</p>
          </div>
        )}
        {groups.map((g) => {
          const joined = !!g.group_members.some((m) => m.user_id === me.id);
          return (
            <Link
              key={g.id}
              to="/groups/$slug"
              params={{ slug: g.slug }}
              className="block rounded-2xl bg-card p-4 shadow-sm border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-[#000080]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#000080]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold leading-tight">{g.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {g.group_members.length} members
                    </span>
                  </div>
                </div>
                <div>
                  {joined ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Member</span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
