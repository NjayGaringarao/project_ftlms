"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { useListState } from "@/hooks/useListState";
import ListItem from "./list-item";
import { Blocks } from "lucide-react";
import { BlockListItem } from "@/lib/admin/blocks";
import AdminListContainer from "./admin-list-container";

type BlocksListProps = {
  blocks: BlockListItem[];
  basePath?: string;
  createPath?: string;
};

export const BlocksList = ({
  blocks,
  basePath = "/blocks",
  createPath = "/blocks/create",
}: BlocksListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [basePath],
  );
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: blocks,
    match: idMatchPattern,
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
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search Blocks by major, program, campus, year level, or section"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Block</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
      directoryLevel="SECOND"
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No blocks match your search.
        </div>
      )}

      {filteredItems.map((block) => (
        <ListItem
          key={block.id}
          onClick={() => router.push(`${basePath}/${block.id}`)}
          title={`${block.major_p_c.program_campus?.program?.code} ${block.year_level} - ${block.section}`}
          subtitle={[
            `${block.major_p_c?.program_campus?.program?.name ?? "Unknown"}`,
            `${block.major_p_c?.major?.name ?? "Unknown Major"}`,
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
    </AdminListContainer>
  );
};
