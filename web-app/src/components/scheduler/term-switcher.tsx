"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import { AppDialog } from "@/components/ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TermListItem } from "@/lib/admin/terms";
import { formatAcademicTermLabel } from "@/utils/string";

type CourseLoadingTermSwitcherProps = {
  terms: TermListItem[];
  selectedTermId: string;
};

const getTargetTermPath = (pathname: string, termId: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const courseLoadingIndex = segments.indexOf("scheduler");
  const section = segments[courseLoadingIndex + 2];

  const suffix =
    section === "faculty" || section === "block" ? `/${section}` : "";

  return `/scheduler/${termId}${suffix}`;
};

export const SchedulerTermSwitcher = ({
  terms,
  selectedTermId,
}: CourseLoadingTermSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? null;

  const filteredTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return terms;
    }

    return terms.filter((term) => {
      const searchable = [
        term.code,
        term.name,
        term.academic_year.code,
        `${term.academic_year.start_year}-${term.academic_year.end_year}`,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [query, terms]);

  if (!selectedTerm) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="max-w-xs bg-background/95 mx-4 py-4"
        onClick={() => setOpen(true)}
        title="Change academic term"
      >
        <Calendar className="h-4 w-4" />
        <span className="truncate text-base">
          {formatAcademicTermLabel(selectedTerm)}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      <AppDialog
        open={open}
        onOpenChange={setOpen}
        title="Select Academic Term"
        description="Search and switch the active scheduling term."
        contentClassName="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
      >
        <div className="flex h-full flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search term"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="px-3 py-2"
          />

          <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {filteredTerms.map((term) => {
              const isSelected = term.id === selectedTermId;

              return (
                <ListItemSmall
                  key={term.id}
                  title={formatAcademicTermLabel(term)}
                  subtitle={[term.code]}
                  isSelected={isSelected}
                  onClick={() => {
                    router.push(getTargetTermPath(pathname, term.id));
                    router.refresh();
                    setOpen(false);
                  }}
                  icon={<Calendar className="h-6 w-6 text-background/70" />}
                />
              );
            })}
          </div>
        </div>
      </AppDialog>
    </>
  );
};
