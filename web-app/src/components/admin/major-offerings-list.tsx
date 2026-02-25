"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import ListItem from "./list-item";
import { Link2 } from "lucide-react";
import { useListState } from "@/hooks/useListState";
import { MajorOfferingListItem } from "@/lib/admin/major-offerings";

type MajorOfferingsListProps = {
  offerings: MajorOfferingListItem[];
  basePath?: string;
  createPath?: string;
};

export const MajorOfferingsList = ({
  offerings,
  basePath = "/major-offerings",
  createPath = "/major-offerings/create",
}: MajorOfferingsListProps) => {
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
        const majorName = offering.major?.name?.toLowerCase() ?? "";
        const majorCode = offering.major?.code?.toLowerCase() ?? "";
        const programName =
          offering.program_campus?.program?.name?.toLowerCase() ?? "";
        const campusName =
          offering.program_campus?.campus?.name?.toLowerCase() ?? "";

        return (
          majorName.includes(q) ||
          majorCode.includes(q) ||
          programName.includes(q) ||
          campusName.includes(q)
        );
      });
    },
  });

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by major, campus, or program"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Major Offering</Link>
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
              No major offerings match your search.
            </div>
          )}

          {filteredItems.map((offering) => (
            <ListItem
              key={offering.id}
              onClick={() => router.push(`${basePath}/${offering.id}`)}
              title={offering.major?.name ?? "Unknown Major"}
              subtitle={[
                `Program: ${offering.program_campus?.program?.name ?? "Unknown"}`,
                `Campus: ${offering.program_campus?.campus?.name ?? "Unknown"}`,
              ]}
              isSelected={selectedId === offering.id}
              icon={<Link2 className="h-14 w-14 text-background" />}
              annotations={
                <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                  {offering.major?.code ?? "N/A"}
                </span>
              }
            />
          ))}
        </div>
      </CardContent>
    </div>
  );
};
