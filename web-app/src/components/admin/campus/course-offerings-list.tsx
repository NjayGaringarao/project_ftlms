"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import ListItem from "../list-item";
import { CalendarCheck2 } from "lucide-react";
import { useListState } from "@/hooks/useListState";
import { CourseOfferingListItem } from "@/lib/admin/course-offerings";
import { getAcademicTermDisplayLabel } from "@/lib/admin/academic-terms";
import AdminListContainer from "../admin-list-container";

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
        const term = offering.term
          ? getAcademicTermDisplayLabel(offering.term).toLowerCase()
          : "";

        return (
          courseTitle.includes(q) || campusName.includes(q) || term.includes(q)
        );
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search by course, campus, or term"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Course Offering</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
      directoryLevel="SECOND"
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
            offering.term ? getAcademicTermDisplayLabel(offering.term) : "N/A",
          ]}
          isSelected={selectedId === offering.id}
          icon={<CalendarCheck2 className="h-14 w-14 text-background" />}
        />
      ))}
    </AdminListContainer>
  );
};
