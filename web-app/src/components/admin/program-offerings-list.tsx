"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import ListItem from "./list-item";
import { Network } from "lucide-react";
import { useListState } from "@/hooks/useListState";
import { ProgramOfferingListItem } from "@/lib/admin/program-offerings";

type ProgramOfferingsListProps = {
  offerings: ProgramOfferingListItem[];
  basePath?: string;
  createPath?: string;
};

export const ProgramOfferingsList = ({
  offerings,
  basePath = "/program-offerings",
  createPath = "/program-offerings/create",
}: ProgramOfferingsListProps) => {
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
        const campusName = offering.campus?.name?.toLowerCase() ?? "";
        const programName = offering.program?.name?.toLowerCase() ?? "";
        const programCode = offering.program?.code?.toLowerCase() ?? "";

        return (
          campusName.includes(q) ||
          programName.includes(q) ||
          programCode.includes(q)
        );
      });
    },
  });

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by campus or program"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href={createPath}>Create Program Offering</Link>
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
              No program offerings match your search.
            </div>
          )}

          {filteredItems.map((offering) => (
            <ListItem
              key={offering.id}
              onClick={() => router.push(`${basePath}/${offering.id}`)}
              title={offering.program?.name ?? "Unknown Program"}
              subtitle={[
                `Campus: ${offering.campus?.name ?? "Unknown Campus"}`,
                `Code: ${offering.program?.code ?? "N/A"}`,
              ]}
              isSelected={selectedId === offering.id}
              icon={<Network className="h-14 w-14 text-background" />}
            />
          ))}
        </div>
      </CardContent>
    </div>
  );
};
