"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RankListItem } from "@/lib/admin/ranks";
import ListItem from "../list-item";
import { Award } from "lucide-react";
import { useListState } from "../../../hooks/useListState";
import AdminListContainer from "../admin-list-container";

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
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search by number, title, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/academic-ranks/create">Create Rank</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
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
    </AdminListContainer>
  );
};
