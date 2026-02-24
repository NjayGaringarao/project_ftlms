"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/utils/style";
import { TermListItem } from "@/lib/admin/terms";
import ListItem from "./list-item";
import { CalendarDays } from "lucide-react";

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
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const selectedTermId = useMemo(() => {
    const match = pathname.match(/\/academic-terms\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return terms;

    return terms.filter((term) => {
      const academicYear = term.academic_year.toLowerCase();
      const termCode = term.term_code.toLowerCase();
      const sequence = String(term.sequence);
      return (
        academicYear.includes(q) || termCode.includes(q) || sequence.includes(q)
      );
    });
  }, [query, terms]);

  return (
    <div className="relative h-full flex flex-col">
      <CardHeader className="flex flex-col gap-4 bg-background/50 backdrop-blur-sm py-4 z-50 top-0">
        <div className="w-full flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            placeholder="Search by academic year, term code, or sequence"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button asChild>
            <Link href="/academic-terms/create">Create Term</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-3 gap-4",
            !!selectedTermId && "flex flex-col gap-4",
          )}
        >
          {filteredTerms.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-foreground/70">
              No terms match your search.
            </div>
          )}

          {filteredTerms.map((term) => {
            const isSelected = selectedTermId === term.id;

            return (
              <ListItem
                key={term.id}
                onClick={() => router.push(`/academic-terms/${term.id}`)}
                title={term.academic_year}
                subtitle={[
                  `${term.term_code} • Sequence ${term.sequence}`,
                  `${formatDate(term.start)} - ${formatDate(term.end)}`,
                ]}
                isSelected={isSelected}
                icon={<CalendarDays className="h-14 w-14 text-background" />}
              />
            );
          })}
        </div>
      </CardContent>
    </div>
  );
};
