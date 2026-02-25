"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import ListItem from "./list-item";
import { CalendarCheck2 } from "lucide-react";
import { useListState } from "@/hooks/useListState";
import { CourseOfferingListItem } from "@/lib/admin/course-offerings";

type CourseOfferingsListProps = {
  offerings: CourseOfferingListItem[];
  basePath?: string;
  createPath?: string;
};

export const CourseOfferingsList = ({
  offerings,
  basePath = "/course-offerings",
  createPath = "/course-offerings/create",
}: CourseOfferingsListProps) => {
  const router = useRouter();
  const idMatchPattern = useMemo(
    () =>
      new RegExp(
        `^${basePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^/]+)(?:/|$)`,
      ),
    [basePath],
  );
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: offerings,
    match: idMatchPattern,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((offering) => {
        const courseTitle = offering.course?.title?.toLowerCase() ?? "";
        const campusName = offering.campus?.name?.toLowerCase() ?? "";
        const term =
          `${offering.term?.academic_year ?? ""} ${offering.term?.term_code ?? ""}`.toLowerCase();

        return (
          courseTitle.includes(q) || campusName.includes(q) || term.includes(q)
        );
      });
    },
  });

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by course, campus, or term"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Course Offering</Link>
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
              No course offerings match your search.
            </div>
          )}

          {filteredItems.map((offering) => (
            <ListItem
              key={offering.id}
              onClick={() => router.push(`${basePath}/${offering.id}`)}
              title={offering.course?.title ?? "Unknown Course"}
              subtitle={[
                `Campus: ${offering.campus?.name ?? "Unknown"}`,
                `${offering.term?.academic_year ?? "N/A"} • ${offering.term?.term_code ?? "N/A"}`,
              ]}
              isSelected={selectedId === offering.id}
              icon={<CalendarCheck2 className="h-14 w-14 text-background" />}
            />
          ))}
        </div>
      </CardContent>
    </div>
  );
};
