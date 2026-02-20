"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { SemesterListItem } from "@/lib/university/semesters";

type SemestersListProps = {
  semesters: SemesterListItem[];
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const SemestersList = ({ semesters }: SemestersListProps) => {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const selectedSemesterId = useMemo(() => {
    const match = pathname.match(/\/university\/semesters\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const filteredSemesters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return semesters;

    return semesters.filter((semester) => {
      const academicYear = semester.academic_year.toLowerCase();
      const term = semester.term.toLowerCase();
      return academicYear.includes(q) || term.includes(q);
    });
  }, [query, semesters]);

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by academic year or term"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/university/semesters/create">Create Semester</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-4",
            !!selectedSemesterId && "flex flex-col gap-4",
          )}
        >
          {filteredSemesters.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No semesters match your search.
            </div>
          )}

          {filteredSemesters.map((semester) => {
            const isSelected = selectedSemesterId === semester.id;

            return (
              <Link
                key={semester.id}
                href={`/university/semesters/${semester.id}`}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4 transition hover:bg-foreground/5 hover:border-foreground/30",
                  isSelected &&
                    "bg-foreground/10 border-foreground/40 font-semibold",
                )}
              >
                <p className="text-base font-semibold">
                  {semester.academic_year}
                </p>
                <p className="text-sm text-foreground/70">{semester.term}</p>
                <p className="text-xs text-foreground/60">
                  {formatDate(semester.start)} - {formatDate(semester.end)}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
