"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACADEMIC_TERM_NAMES } from "@/features/admin/lib/academic-terms";
import type { AcademicTermName } from "@/features/shared/types/models";

type AcademicCalendarTermFormState = {
  start: string;
  end: string;
};

export type AcademicCalendarFormState = {
  start_year: string;
  end_year: string;
  terms: Record<AcademicTermName, AcademicCalendarTermFormState>;
};

type InitialFormProps = {
  formData: AcademicCalendarFormState;
  onChange: (field: "start_year" | "end_year", value: string) => void;
  onTermChange: (
    name: AcademicTermName,
    field: keyof AcademicCalendarTermFormState,
    value: string,
  ) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isCreating: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  statusSlot?: ReactNode;
  showActions?: boolean;
};

export const InitialForm = ({
  formData,
  onChange,
  onTermChange,
  onReset,
  onSubmit,
  isSaving,
  isCreating,
  submitDisabled = false,
  submitLabel,
  submitLoadingLabel,
  statusSlot,
  showActions = true,
}: InitialFormProps) => {
  return (
    <div className="space-y-4">
      {statusSlot}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label className="text-xs" htmlFor="calendar-start-year">
            Start Year *
          </Label>
          <Input
            id="calendar-start-year"
            type="number"
            value={formData.start_year}
            onChange={(event) => onChange("start_year", event.target.value)}
            className="mt-1"
            disabled={isSaving || !isCreating}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="calendar-end-year">
            End Year *
          </Label>
          <Input
            id="calendar-end-year"
            type="number"
            value={formData.end_year}
            onChange={(event) => onChange("end_year", event.target.value)}
            className="mt-1"
            disabled={isSaving || !isCreating}
          />
        </div>
      </div>

      {isCreating ? (
        <section className="space-y-3 border-t pt-4">
          <div>
            <h2 className="font-semibold">Academic Terms</h2>
            <p className="text-xs text-foreground/70">
              Configure all required terms before creating the academic year.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {ACADEMIC_TERM_NAMES.map((termName) => (
              <article
                key={termName}
                className="space-y-3 rounded-md border bg-background p-4"
              >
                <h3 className="text-sm font-semibold">{termName}</h3>
                <div>
                  <Label
                    className="text-xs"
                    htmlFor={`calendar-${termName}-start`}
                  >
                    Start Date *
                  </Label>
                  <Input
                    id={`calendar-${termName}-start`}
                    type="date"
                    value={formData.terms[termName].start}
                    onChange={(event) =>
                      onTermChange(termName, "start", event.target.value)
                    }
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label
                    className="text-xs"
                    htmlFor={`calendar-${termName}-end`}
                  >
                    End Date *
                  </Label>
                  <Input
                    id={`calendar-${termName}-end`}
                    type="date"
                    value={formData.terms[termName].end}
                    onChange={(event) =>
                      onTermChange(termName, "end", event.target.value)
                    }
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {showActions ? (
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onReset} disabled={isSaving}>
            Reset
          </Button>
          <Button onClick={onSubmit} disabled={isSaving || submitDisabled}>
            {isSaving ? submitLoadingLabel : submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
