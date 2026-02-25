"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { useListState } from "@/hooks/useListState";
import ListItem from "./list-item";
import { BookOpen } from "lucide-react";
import { ExtendedProgram } from "@/models";

type ProgramsListProps = {
  programs: ExtendedProgram[];
};

export const ProgramsList = ({ programs }: ProgramsListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: programs,
    match: /\/programs\/([^\/]+)/,
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
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by code, program, or department"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/programs/create">Create Program</Link>
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
              No programs match your search.
            </div>
          )}

          {filteredItems.map((program) => (
            <ListItem
              key={program.id}
              onClick={() => router.push(`/programs/${program.id}`)}
              title={program.name}
              subtitle={[
                `Department: ${program.department?.name ?? "Unknown"}`,
                program.description || "No description",
              ]}
              isSelected={selectedId === program.id}
              icon={<BookOpen className="h-14 w-14 text-background" />}
              annotations={
                <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                  {program.code}
                </span>
              }
            />
          ))}
        </div>
      </CardContent>
    </div>
  );
};
