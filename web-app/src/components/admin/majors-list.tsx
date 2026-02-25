"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import ListItem from "./list-item";
import { Layers } from "lucide-react";
import { useListState } from "@/hooks/useListState";
import { MajorListItem } from "@/lib/admin/majors";

type MajorsListProps = {
  majors: MajorListItem[];
  basePath?: string;
  createPath?: string;
};

export const MajorsList = ({
  majors,
  basePath = "/majors",
  createPath = "/majors/create",
}: MajorsListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [basePath],
  );
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: majors,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((major) => {
        const code = major.code.toLowerCase();
        const name = major.name.toLowerCase();
        const programName = major.program?.name?.toLowerCase() ?? "";

        return code.includes(q) || name.includes(q) || programName.includes(q);
      });
    },
  });

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by code, major, or program"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Major</Link>
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
              No majors match your search.
            </div>
          )}

          {filteredItems.map((major) => (
            <ListItem
              key={major.id}
              onClick={() => router.push(`${basePath}/${major.id}`)}
              title={major.name}
              subtitle={[
                `Program: ${major.program?.name ?? "Unknown"}`,
                major.description || "No description",
              ]}
              isSelected={selectedId === major.id}
              icon={<Layers className="h-14 w-14 text-background" />}
              annotations={
                <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                  {major.code}
                </span>
              }
            />
          ))}
        </div>
      </CardContent>
    </div>
  );
};
