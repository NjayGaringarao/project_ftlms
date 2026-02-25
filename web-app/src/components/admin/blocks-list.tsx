"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { useListState } from "@/hooks/useListState";
import ListItem from "./list-item";
import { Blocks } from "lucide-react";
import { BlockListItem } from "@/lib/admin/blocks";

type BlocksListProps = {
  blocks: BlockListItem[];
};

export const BlocksList = ({ blocks }: BlocksListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: blocks,
    match: /\/blocks\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((block) => {
        const major = block.major_p_c?.major?.name?.toLowerCase() ?? "";
        const campus =
          block.major_p_c?.program_campus?.campus?.name?.toLowerCase() ?? "";
        const program =
          block.major_p_c?.program_campus?.program?.name?.toLowerCase() ?? "";
        const section = block.section.toLowerCase();
        const yearLevel = `year ${block.year_level}`;

        return (
          major.includes(q) ||
          campus.includes(q) ||
          program.includes(q) ||
          section.includes(q) ||
          yearLevel.includes(q)
        );
      });
    },
  });

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by major, program, campus, year, or section"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/blocks/create">Create Block</Link>
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
              No blocks match your search.
            </div>
          )}

          {filteredItems.map((block) => (
            <ListItem
              key={block.id}
              onClick={() => router.push(`/blocks/${block.id}`)}
              title={`Year ${block.year_level} - ${block.section}`}
              subtitle={[
                `Major: ${block.major_p_c?.major?.name ?? "Unknown"}`,
                `Program: ${block.major_p_c?.program_campus?.program?.name ?? "Unknown"}`,
                `Campus: ${block.major_p_c?.program_campus?.campus?.name ?? "Unknown"}`,
              ]}
              isSelected={selectedId === block.id}
              icon={<Blocks className="h-14 w-14 text-background" />}
              annotations={
                <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                  {block.student_count ?? 0} students
                </span>
              }
            />
          ))}
        </div>
      </CardContent>
    </div>
  );
};
