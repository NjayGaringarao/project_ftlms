"use client";

import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import ListItemSmall from "@/components/ui/list-item-small";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { ScheduleAcademicTermOption } from "@/features/scheduler/lib/schedule/types";
import { formatAcademicTermLabel } from "@/utils/string";

type AcademicTermPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terms: ScheduleAcademicTermOption[];
  selectedTermId: string | null;
  onSelectTerm: (termId: string) => void;
};

export const AcademicTermPickerDialog = ({
  open,
  onOpenChange,
  terms,
  selectedTermId,
  onSelectTerm,
}: AcademicTermPickerDialogProps) => {
  const [query, setQuery] = useState("");

  const filteredTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return terms;

    return terms.filter((term) => {
      const searchable =
        `${term.code} ${term.academic_year.start_year}-${term.academic_year.end_year} ${term.name}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, terms]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Academic Term"
      contentClassName="flex flex-col flex-1 max-h-11/12 w-full"
      variant="floating-large"
    >
      <div className="h-full flex flex-col gap-3 overflow-hidden p-4">
        <Input
          placeholder="Search term"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="px-3 py-2"
        />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto">
          {filteredTerms.map((term) => {
            const isSelected = selectedTermId === term.id;

            return (
              <ListItemSmall
                key={term.id}
                title={formatAcademicTermLabel(term)}
                subtitle={[]}
                isSelected={isSelected}
                onClick={() => onSelectTerm(term.id)}
                icon={<Calendar className="h-6 w-6 text-background/70" />}
              />
            );
          })}
        </div>
      </div>
    </AppDialog>
  );
};
