"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AcademicCalendarFormState = {
  start_year: string;
  end_year: string;
};

type InitialFormProps = {
  formData: AcademicCalendarFormState;
  onChange: (field: keyof AcademicCalendarFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  statusSlot?: ReactNode;
  showActions?: boolean;
};

export const InitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
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
            disabled={isSaving}
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
            disabled={isSaving}
          />
        </div>
      </div>

      {showActions ? (
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onReset} disabled={isSaving}>
            Reset
          </Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving ? submitLoadingLabel : submitLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
