"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ListItem from "../list-item";
import { BookCopy } from "lucide-react";
import { useListState } from "@/hooks/useListState";
import { CurriculumListItem } from "@/lib/admin/curriculums";
import AdminListContainer from "../admin-list-container";

type CurriculumsListProps = {
  curriculums: CurriculumListItem[];
  basePath: string;
  createPath: string;
};

export const CurriculumsList = ({
  curriculums,
  basePath,
  createPath,
}: CurriculumsListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [basePath],
  );

  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: curriculums,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((curriculum) => {
        const title = curriculum.title.toLowerCase();
        const seriesYear = String(curriculum.series_year);
        const revisedYear = curriculum.revised_year
          ? String(curriculum.revised_year)
          : "";

        return (
          title.includes(q) || seriesYear.includes(q) || revisedYear.includes(q)
        );
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search by title, series year, or revised year"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Curriculum</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
      directoryLevel="SECOND"
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No curriculums match your search.
        </div>
      )}

      {filteredItems.map((curriculum) => (
        <ListItem
          key={curriculum.id}
          onClick={() => router.push(`${basePath}/${curriculum.id}`)}
          title={curriculum.title}
          subtitle={[
            `Series Year: ${curriculum.series_year}`,
            curriculum.revised_year
              ? `Revised Year: ${curriculum.revised_year}`
              : "Not revised",
          ]}
          isSelected={selectedId === curriculum.id}
          icon={<BookCopy className="h-14 w-14 text-background" />}
        />
      ))}
    </AdminListContainer>
  );
};
