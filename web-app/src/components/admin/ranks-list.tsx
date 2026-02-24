"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { RankListItem } from "@/lib/admin/ranks";

type RanksListProps = {
  ranks: RankListItem[];
};

export const RanksList = ({ ranks }: RanksListProps) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedRankId = useMemo(() => {
    const match = pathname.match(/\/academic-ranks\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const filteredRanks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranks;

    return ranks.filter((rank) => {
      const number = rank.number.toString().toLowerCase();
      const title = rank.title.toLowerCase();
      const description = rank.description?.toLowerCase() ?? "";
      return number.includes(q) || title.includes(q) || description.includes(q);
    });
  }, [query, ranks]);

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by number, title, or description"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/academic-ranks/create">Create Rank</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-4",
            !!selectedRankId && "flex flex-col gap-4",
          )}
        >
          {filteredRanks.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No ranks match your search.
            </div>
          )}

          {filteredRanks.map((rank) => {
            const isSelected = selectedRankId === rank.id;

            return (
              <Link
                key={rank.id}
                href={`/academic-ranks/${rank.id}`}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 transition hover:bg-foreground/5 hover:border-foreground/30",
                  isSelected &&
                    "bg-foreground/10 border-foreground/40 font-semibold",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold">{rank.title}</p>
                  <span className="inline-flex rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground">
                    #{rank.number}
                  </span>
                </div>
                <p className="text-sm text-foreground/70 line-clamp-2">
                  {rank.description || "No description available"}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
