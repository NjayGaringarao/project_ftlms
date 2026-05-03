"use client";

import { useMemo, useState } from "react";
import { Calendar, Star, Trash2 } from "lucide-react";
import { AddTile } from "@/components/ui/add-tile";
import { Button } from "@/components/ui/button";
import { deleteTerm, setDefaultAcademicTerm } from "@/features/admin/lib/actions";
import { ACADEMIC_TERM_NAMES } from "@/features/admin/lib/academic-terms";
import type { TermListItem } from "@/features/admin/lib/terms";
import type { AcademicTermName } from "@/features/shared/types/models";
import type { AcademicYear } from "@/features/shared/types/models/academic_year";
import DeleteConfirmModal from "../delete-confirm-modal";
import FormStatusBanner from "../form-status-banner";
import { TermDialog } from "./term-dialog";

type TermsGridProps = {
  year: AcademicYear;
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
  year,
  terms,
  defaultTermId,
  onTermsChange,
}: TermsGridProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<TermListItem | null>(null);
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
  const usedNames = useMemo(
    () => new Set(terms.map((term) => term.name)),
    [terms],
  );
  const availableNames = ACADEMIC_TERM_NAMES.filter(
    (name) => !usedNames.has(name),
  );

  const handleDelete = async () => {
    if (!termToDelete) return;
    setIsMutating(true);
    setError("");
    setSuccess("");
    const result = await deleteTerm(termToDelete.id);
    setIsMutating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTermToDelete(null);
    onTermsChange();
  };

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
                <p className="min-w-0 truncate text-base font-semibold">
                  {term.code}
                </p>
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
                  
                  <Button
                    type="button"
            
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setTermToDelete(term);
                    }}
                    disabled={isMutating}
                    title="Delete term"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                </div>
              </div>
            </article>
          );
        })}

        <AddTile
          title="Add Term"
          onClick={() => {
            setError("");
            setSuccess("");
            setIsCreateOpen(true);
          }}
          disabled={availableNames.length === 0 || isMutating}
          containerClassName="flex-col items-center justify-center"
        />
      </div>

      <TermDialog
        key={isCreateOpen ? "open-term" : "closed-term"}
        open={isCreateOpen}
        year={year}
        availableNames={availableNames}
        onClose={() => setIsCreateOpen(false)}
        onRefresh={onTermsChange}
      />

      <DeleteConfirmModal
        isOpen={termToDelete !== null}
        title="Delete Term"
        description={
          <p>
            Are you sure you want to delete{" "}
            <strong>{termToDelete?.name}</strong>?
          </p>
        }
        confirmLabel="Delete Term"
        isDeleting={isMutating}
        error={error}
        onCancel={() => {
          setError("");
          setTermToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </section>
  );
}
