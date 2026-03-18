"use client";

import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { AcademicTermName } from "@/models";
import {
  ACADEMIC_TERM_NAMES,
  getAcademicTermNameLabel,
} from "@/lib/admin/academic-terms";
import { AcademicYearListItem } from "@/lib/admin/academic-years";

type TermFormState = {
  academic_year_id: string;
  name: AcademicTermName;
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
  academicYears: AcademicYearListItem[];
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
  academicYears,
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

        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-xs" htmlFor="academic_year_id">
              Academic Year *
            </Label>
            <select
              id="academic_year_id"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              value={formData.academic_year_id}
              onChange={(event) => onChange("academic_year_id", event.target.value)}
              disabled={isSaving}
            >
              <option value="" disabled>
                Select academic year
              </option>
              {academicYears.map((academicYear) => (
                <option key={academicYear.id} value={academicYear.id}>
                  {academicYear.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs" htmlFor="term-name">
              Term Name *
            </Label>
            <select
              id="term-name"
              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
              value={formData.name}
              onChange={(event) => onChange("name", event.target.value as AcademicTermName)}
              disabled={isSaving}
            >
              {ACADEMIC_TERM_NAMES.map((termName) => (
                <option key={termName} value={termName}>
                  {getAcademicTermNameLabel(termName)}
                </option>
              ))}
            </select>
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
