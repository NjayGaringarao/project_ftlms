"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AcademicYearListItem } from "@/lib/admin/academic-years";
import ListItem from "../../ui/list-item";
import { useListState } from "@/hooks/useListState";
import ListContainer from "@/components/ui/list-container";

type YearsListProps = {
  years: AcademicYearListItem[];
};

export const YearsList = ({ years }: YearsListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: years,
    match: /\/academic-years\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((year) => {
        const code = year.code.toLowerCase();
        const range = `${year.start_year}-${year.end_year}`;
        return code.includes(q) || range.includes(q);
      });
    },
  });

  return (
    <ListContainer
      header={
        <>
          <Input
            placeholder="Search by code or year range"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/academic-years/create">Create Academic Year</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No academic years match your search.
        </div>
      )}

      {filteredItems.map((year) => (
        <ListItem
          key={year.id}
          onClick={() => router.push(`/academic-years/${year.id}`)}
          title={`A.Y. ${year.code}`}
          subtitle={[]}
   
          isSelected={selectedId === year.id}
          icon={<CalendarRange className="h-14 w-14 text-background" />}
        />
      ))}
    </ListContainer>
  );
};
