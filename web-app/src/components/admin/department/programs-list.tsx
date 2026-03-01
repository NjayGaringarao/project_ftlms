"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useListState } from "@/hooks/useListState";
import ListItem from "../list-item";
import { BookOpen } from "lucide-react";
import { ExtendedProgram } from "@/models";
import AdminListContainer from "../admin-list-container";

type ProgramsListProps = {
  programs: ExtendedProgram[];
  basePath?: string;
  createPath?: string;
};

export const ProgramsList = ({
  programs,
  basePath = "/programs",
  createPath = "/programs/create",
}: ProgramsListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [basePath],
  );
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: programs,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((program) => {
        const code = program.code.toLowerCase();
        const name = program.name.toLowerCase();
        const department = program.department?.name?.toLowerCase() ?? "";

        return code.includes(q) || name.includes(q) || department.includes(q);
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search Programs by code or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Program</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
      directoryLevel="SECOND"
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No programs match your search.
        </div>
      )}

      {filteredItems.map((program) => (
        <ListItem
          key={program.id}
          onClick={() => router.push(`${basePath}/${program.id}`)}
          title={program.name}
          subtitle={[program.description || "No description"]}
          isSelected={selectedId === program.id}
          icon={<BookOpen className="h-14 w-14 text-background" />}
          annotations={
            <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
              {program.code}
            </span>
          }
        />
      ))}
    </AdminListContainer>
  );
};
