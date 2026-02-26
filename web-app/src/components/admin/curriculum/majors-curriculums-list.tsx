"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useListState } from "@/hooks/useListState";
import { MajorListItem } from "@/lib/admin/majors";
import ListItem from "../list-item";
import { BookMarked } from "lucide-react";
import AdminListContainer from "../admin-list-container";

type MajorsCurriculumsListProps = {
  majors: MajorListItem[];
};

export const MajorsCurriculumsList = ({
  majors,
}: MajorsCurriculumsListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(() => /^\/curriculums\/([^/]+)(?:\/|$)/, []);

  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: majors,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((major) => {
        const majorCode = major.code.toLowerCase();
        const majorName = major.name.toLowerCase();
        const programCode = major.program?.code?.toLowerCase() ?? "";
        const programName = major.program?.name?.toLowerCase() ?? "";

        return (
          majorCode.includes(q) ||
          majorName.includes(q) ||
          programCode.includes(q) ||
          programName.includes(q)
        );
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <Input
          placeholder="Search major by code, name, or program"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      }
      isItemSelected={!!selectedId}
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No majors match your search.
        </div>
      )}

      {filteredItems.map((major) => (
        <ListItem
          key={major.id}
          onClick={() => router.push(`/curriculums/${major.id}/curriculums`)}
          title={`${major.program.code} - ${major.name}`}
          subtitle={[major.program?.department.name ?? "Unknown Department"]}
          isSelected={selectedId === major.id}
          icon={<BookMarked className="h-14 w-14 text-background" />}
          annotations={
            <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
              {major.program.code}-{major.code}
            </span>
          }
        />
      ))}
    </AdminListContainer>
  );
};
