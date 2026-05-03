"use client";

import { useMemo, useState } from "react";
import { Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACADEMIC_TERM_NAMES } from "@/features/admin/lib/academic-terms";
import { setDefaultAcademicTerm } from "@/features/admin/lib/actions";
import type { TermListItem } from "@/features/admin/lib/terms";
import type { AcademicTermName } from "@/features/shared/types/models";
import { formatDate } from "@/utils/time";
import FormStatusBanner from "../form-status-banner";

type TermsGridProps = {
  terms: TermListItem[];
  defaultTermId: string | null;
  onTermsChange: () => void;
};

const termOrder: Record<AcademicTermName, number> = {
  "FIRST SEMESTER": 1,
  "SECOND SEMESTER": 2,
  MIDYEAR: 3,
};

export function TermsGrid({
  terms,
  defaultTermId,
  onTermsChange,
}: TermsGridProps) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sortedTerms = useMemo(
    () =>
      [...terms].sort(
        (first, second) => termOrder[first.name] - termOrder[second.name],
      ),
    [terms],
  );

  const handleSetDefault = async (term: TermListItem) => {
    setIsMutating(true);
    setError("");
    setSuccess("");
    const result = await setDefaultAcademicTerm(term.id);
    setIsMutating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(`${term.name} is now the default academic term.`);
    onTermsChange();
  };

  return (
    <section className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <div>
          <h2 className="font-semibold">Academic Terms</h2>
          <p className="text-xs text-foreground/70">
            {terms.length} of {ACADEMIC_TERM_NAMES.length} terms configured
          </p>
        </div>
      </div>

      <FormStatusBanner
        variant="compact"
        success={success ? { title: success } : undefined}
        error={error}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sortedTerms.map((term) => {
          const isDefault = term.id === defaultTermId;

          return (
            <article
              key={term.id}
              className="rounded-md border bg-background p-4"
            >
              <div className="flex flex-col gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-base font-semibold">
                    {term.code}
                  </p>
                  <p className="text-xs text-foreground/70">
                    Start: {formatDate(term.start)}
                  </p>
                  <p className="text-xs text-foreground/70">
                    End: {formatDate(term.end)}
                  </p>
                </div>

                <div className="flex items-center self-end gap-2">
                  {isDefault ? (
                    <Button
                      type="button"
                      size="sm"
                      className="pointer-events-none gap-1"
                      disabled={isMutating}
                    >
                      <Star className="h-3 w-3" />
                      Default
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(term)}
                      disabled={isMutating}
                    >
                      Set Default
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
