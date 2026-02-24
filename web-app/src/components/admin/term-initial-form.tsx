"use client";

import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

type TermFormState = {
  academic_year: string;
  term_code: string;
  sequence: string;
  start: string;
  end: string;
};

type TermInitialFormProps = {
  formData: TermFormState;
  onChange: (field: keyof TermFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  termCodePlaceholder?: string;
  normalizeSequenceOnBlur?: boolean;
  statusSlot?: ReactNode;
  extraFields?: ReactNode;
};

export const TermInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
  submitLabel,
  submitLoadingLabel,
  termCodePlaceholder = "e.g. 1ST",
  normalizeSequenceOnBlur = true,
  statusSlot,
  extraFields,
}: TermInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b">
          <Calendar className="w-5 h-5" />
          <h3 className="font-semibold">Term Profile</h3>
        </div>

        {statusSlot}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs" htmlFor="academic_year">
              Academic Year *
            </Label>
            <Input
              id="academic_year"
              placeholder="e.g. 2025-2026"
              value={formData.academic_year}
              onChange={(event) =>
                onChange("academic_year", event.target.value)
              }
              onBlur={(event) =>
                onChange("academic_year", event.target.value.trim())
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="term_code">
              Term Code *
            </Label>
            <Input
              id="term_code"
              placeholder={termCodePlaceholder}
              value={formData.term_code}
              onChange={(event) => onChange("term_code", event.target.value)}
              onBlur={(event) =>
                onChange("term_code", event.target.value.trim().toUpperCase())
              }
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="sequence">
              Sequence *
            </Label>
            <Input
              id="sequence"
              type="number"
              placeholder="e.g. 1"
              value={formData.sequence}
              onChange={(event) => onChange("sequence", event.target.value)}
              onBlur={(event) => {
                if (normalizeSequenceOnBlur) {
                  onChange("sequence", event.target.value.trim());
                }
              }}
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="start">
              Start Date *
            </Label>
            <Input
              id="start"
              type="date"
              value={formData.start}
              onChange={(event) => onChange("start", event.target.value)}
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label className="text-xs" htmlFor="end">
              End Date *
            </Label>
            <Input
              id="end"
              type="date"
              value={formData.end}
              onChange={(event) => onChange("end", event.target.value)}
              className="mt-1"
              disabled={isSaving}
            />
          </div>
        </div>
      </div>

      {extraFields}

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onReset} disabled={isSaving}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? submitLoadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
};

export type { TermFormState };
