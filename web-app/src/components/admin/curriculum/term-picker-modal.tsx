"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { AppDialog } from "@/components/ui/app-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TermListItem } from "@/lib/admin/terms";

type TermPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terms: TermListItem[];
  linkedTermIds: string[];
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
  error?: string;
  onSelect: (termId: string) => void;
};

export const TermPickerModal = ({
  open,
  onOpenChange,
  terms,
  linkedTermIds,
  query,
  onQueryChange,
  isLoading,
  error,
  onSelect,
}: TermPickerModalProps) => {
  const normalizedLinkedTermIds = useMemo(
    () => new Set(linkedTermIds),
    [linkedTermIds],
  );

  const filteredTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return terms.filter((term) => {
      if (!normalizedQuery) return true;

      const haystack = [
        term.code,
        `${term.academic_year_start}-${term.academic_year_end}`,
        term.type,
        term.term_order,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, terms]);

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select Academic Term"
      description="Choose one term to create a curriculum term block."
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <Input
            placeholder="Search by code, academic year, type, or order"
            className="pl-9"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {filteredTerms.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-sm text-foreground/70">
              No terms match your search.
            </div>
          )}

          {filteredTerms.map((term) => {
            const isLinked = normalizedLinkedTermIds.has(term.id);

            return (
              <div
                key={term.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{term.code}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isLinked ? "secondary" : "default"}
                  onClick={() => onSelect(term.id)}
                  disabled={isLoading || isLinked}
                >
                  {isLinked ? "Linked" : "Add Term"}
                </Button>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-900">
            {error}
          </p>
        )}
      </div>
    </AppDialog>
  );
};
