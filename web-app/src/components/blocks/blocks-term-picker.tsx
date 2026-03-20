"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronDown } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import ListItemSmall from "@/components/ui/list-item-small";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/style";
import { formatAcademicTermLabel } from "@/utils/string";
import type { TermListItem } from "@/lib/admin/terms";

type BlocksTermPickerProps = {
  terms: TermListItem[];
};

const BlocksTermPicker = ({ terms }: BlocksTermPickerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const academicTermId = searchParams.get("academic_term_id") ?? "";
  const defaultTermId = terms[0]?.id ?? "";

  const selectedTerm =
    terms.find((term) => term.id === academicTermId) ?? null;

  const filteredTerms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return terms;

    return terms.filter((term) => {
      const searchable = [
        term.code,
        term.name,
        term.academic_year.code,
        `${term.academic_year.start_year}-${term.academic_year.end_year}`,
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalized);
    });
  }, [query, terms]);

  useEffect(() => {
    if (academicTermId || !defaultTermId) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set("academic_term_id", defaultTermId);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }, [academicTermId, defaultTermId, pathname, router, searchParams]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
  }, [open]);

  const setAcademicTerm = (termId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("academic_term_id", termId);
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <>
      <Button
        variant="outline"
     
        className={cn(
          "bg-background/95 text-foreground justify-between",
          !selectedTerm && "text-foreground/60",
        )}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4" />
          <span className="truncate text-base">
            {selectedTerm
              ? formatAcademicTermLabel(selectedTerm)
              : "Select academic term..."}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-foreground/60" />
      </Button>

      <AppDialog
        open={open}
        onOpenChange={setOpen}
        title="Select Academic Term"
        description="Filter blocks by academic term."
        contentClassName="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden"
      >
        <div className="flex h-full flex-col gap-3 overflow-hidden">
          <Input
            placeholder="Search term"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
            {filteredTerms.length === 0 && (
              <p className="p-4 text-center text-sm text-foreground/70">
                No academic terms found.
              </p>
            )}

            {filteredTerms.map((term) => (
              <ListItemSmall
                key={term.id}
                title={formatAcademicTermLabel(term)}
                subtitle={[]}
                isSelected={term.id === academicTermId}
                onClick={() => {
                  setAcademicTerm(term.id);
                  setOpen(false);
                }}
                icon={<Calendar className="h-8 w-8 text-background/80" />}
                listType="modal"
              />
            ))}
          </div>
        </div>
      </AppDialog>
    </>
  );
};

export default BlocksTermPicker;
