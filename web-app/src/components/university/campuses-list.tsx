"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { CampusListItem } from "@/lib/university/campuses";

type CampusesListProps = {
  campuses: CampusListItem[];
};

export const CampusesList = ({ campuses }: CampusesListProps) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedCampusId = useMemo(() => {
    const match = pathname.match(/\/campuses\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const filteredCampuses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return campuses;

    return campuses.filter((campus) => {
      const name = campus.name.toLowerCase();
      const address = campus.address?.toLowerCase() ?? "";
      const zipCode = campus.zip_code?.toLowerCase() ?? "";
      return name.includes(q) || address.includes(q) || zipCode.includes(q);
    });
  }, [campuses, query]);

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by name, address, or ZIP"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/campuses/create">Create Campus</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-4",
            !!selectedCampusId && "flex flex-col gap-4",
          )}
        >
          {filteredCampuses.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No campuses match your search.
            </div>
          )}

          {filteredCampuses.map((campus) => {
            const isSelected = selectedCampusId === campus.id;

            return (
              <Link
                key={campus.id}
                href={`/campuses/${campus.id}`}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 transition hover:bg-foreground/5 hover:border-foreground/30",
                  isSelected &&
                    "bg-foreground/10 border-foreground/40 font-semibold",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold">{campus.name}</p>
                </div>
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {campus.address || "No address available"}
                </p>
                <p className="text-xs text-foreground/60">
                  {campus.zip_code ? `ZIP ${campus.zip_code}` : "ZIP not set"}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
