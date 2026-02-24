"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { RankListItem } from "@/lib/admin/ranks";
import ListItem from "./list-item";
import { Award } from "lucide-react";
import { useListState } from "../../hooks/useListState";

type RanksListProps = {
  ranks: RankListItem[];
};

export const RanksList = ({ ranks }: RanksListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: ranks,
    match: /\/academic-ranks\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((rank) => {
        const number = rank.number.toString().toLowerCase();
        const title = rank.title.toLowerCase();
        const description = rank.description?.toLowerCase() ?? "";
        return (
          number.includes(q) || title.includes(q) || description.includes(q)
        );
      });
    },
  });

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by number, title, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/academic-ranks/create">Create Rank</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-4",
            !!selectedId && "flex flex-col gap-4",
          )}
        >
          {filteredItems.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No ranks match your search.
            </div>
          )}

          {filteredItems.map((rank) => {
            const isSelected = selectedId === rank.id;

            return (
              <ListItem
                key={rank.id}
                onClick={() => router.push(`/academic-ranks/${rank.id}`)}
                title={rank.title}
                subtitle={[rank.description || "No description available"]}
                isSelected={isSelected}
                icon={<Award className="h-14 w-14 text-background" />}
                annotations={
                  <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                    #{rank.number}
                  </span>
                }
              />
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
