"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { CampusListItem } from "@/lib/admin/campuses";
import ListItem from "./list-item";
import { Landmark } from "lucide-react";

type CampusesListProps = {
  campuses: CampusListItem[];
};

export const CampusesList = ({ campuses }: CampusesListProps) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const router = useRouter();

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
              <ListItem
                key={campus.id}
                onClick={() => router.push(`/campuses/${campus.id}`)}
                title={campus.name}
                subtitle={[`${campus.address} | ${campus.zip_code}`]}
                isSelected={isSelected}
                icon={<Landmark className="h-14 w-14 text-background" />}
              />
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
