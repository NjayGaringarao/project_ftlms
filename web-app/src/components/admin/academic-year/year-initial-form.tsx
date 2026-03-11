"use client";

import { CalendarRange } from "lucide-react";
import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type YearFormState = {
  code: string;
  start_year: string;
  end_year: string;
};

type YearInitialFormProps = {
  formData: YearFormState;
  onChange: (field: keyof YearFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel: string;
  submitLoadingLabel: string;
  statusSlot?: ReactNode;
  isCodeReadOnly?: boolean;
  isReadOnly?: boolean;
  hideActions?: boolean;
};

export const YearInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving,
  submitLabel,
  submitLoadingLabel,
  statusSlot,
  isCodeReadOnly = false,
  isReadOnly = false,
  hideActions = false,
}: YearInitialFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <CalendarRange className="w-5 h-5" />
        <h3 className="font-semibold">Academic Year Profile</h3>
      </div>

      {statusSlot}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-xs" htmlFor="year-code">
            Code *
          </Label>
          <Input
            id="year-code"
            value={formData.code}
            onChange={(event) => onChange("code", event.target.value)}
            className="mt-1"
            disabled={isSaving || isCodeReadOnly || isReadOnly}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="year-start">
            Start Year *
          </Label>
          <Input
            id="year-start"
            type="number"
            value={formData.start_year}
            onChange={(event) => onChange("start_year", event.target.value)}
            className="mt-1"
            disabled={isSaving || isReadOnly}
          />
        </div>

        <div>
          <Label className="text-xs" htmlFor="year-end">
            End Year *
          </Label>
          <Input
            id="year-end"
            type="number"
            value={formData.end_year}
            onChange={(event) => onChange("end_year", event.target.value)}
            className="mt-1"
            disabled={isSaving || isReadOnly}
          />
        </div>
      </div>

      {!hideActions && (
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onReset} disabled={isSaving || isReadOnly}>
            Reset
          </Button>
          <Button onClick={onSubmit} disabled={isSaving || isReadOnly}>
            {isSaving ? submitLoadingLabel : submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
