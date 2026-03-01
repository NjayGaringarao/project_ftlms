"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TermListItem } from "@/lib/admin/terms";
import ListItem from "../list-item";
import { CalendarDays } from "lucide-react";
import { useListState } from "../../../hooks/useListState";
import {
  getAcademicTermDisplayLabel,
  getAcademicYearLabel,
  getTermOrderLabel,
  getTermTypeLabel,
} from "@/lib/admin/academic-terms";
import AdminListContainer from "../admin-list-container";

type TermsListProps = {
  terms: TermListItem[];
};

const formatDate = (value: string | null) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const TermsList = ({ terms }: TermsListProps) => {
  const router = useRouter();
  const { query, setQuery, selectedId, filteredItems } = useListState({
    items: terms,
    match: /\/academic-terms\/([^\/]+)/,
    filter: (items, rawQuery) => {
      const q = rawQuery.trim().toLowerCase();
      if (!q) return items;

      return items.filter((term) => {
        const academicYear = getAcademicYearLabel(
          term.academic_year_start,
          term.academic_year_end,
        ).toLowerCase();
        const type = getTermTypeLabel(term.type).toLowerCase();
        const termOrder = getTermOrderLabel(term.term_order).toLowerCase();
        const code = term.code.toLowerCase();
        const display = getAcademicTermDisplayLabel(term).toLowerCase();

        return (
          academicYear.includes(q) ||
          type.includes(q) ||
          termOrder.includes(q) ||
          code.includes(q) ||
          display.includes(q)
        );
      });
    },
  });

  return (
    <AdminListContainer
      header={
        <>
          <Input
            placeholder="Search by year, type, order, or code"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/academic-terms/create">Create Term</Link>
          </Button>
        </>
      }
      isItemSelected={!!selectedId}
    >
      {filteredItems.length === 0 && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
          No terms match your search.
        </div>
      )}

      {filteredItems.map((term) => {
        const isSelected = selectedId === term.id;

        return (
          <ListItem
            key={term.id}
            onClick={() => router.push(`/academic-terms/${term.id}`)}
            title={getAcademicTermDisplayLabel(term)}
            subtitle={[
              `Start: ${formatDate(term.start)} | End: ${formatDate(term.end)}`,
            ]}
            isSelected={isSelected}
            icon={<CalendarDays className="h-14 w-14 text-background" />}
          />
        );
      })}
    </AdminListContainer>
  );
};
